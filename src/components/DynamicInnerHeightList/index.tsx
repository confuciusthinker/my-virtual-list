import React from "react";
import { binarySearch, CompareResult } from "./bst";

export interface DynamicInnerHeightListProps {
  /**
   * 用户视野高度
   */
  userHeight: number;
  /**
   * 数据总数
   */
  total: number;
  /**
   * 估算的每个item的行高
   */
  estimateRowHeight: number;
  /**
   * 每个item的渲染方法
   * @param index 序列号
   * @param styleData 样式
   */
  rowRender: (index: number, styleData: React.CSSProperties) => any;
  /**
   * 缓冲区的个数
   */
  bufferSize?: number;
  /**
   * no-data时的显示
   */
  noDataContent?: React.ReactNode;
}

interface CachedPosition {
  /**
   * 元素的下标
   */
  index: number;
  /**
   * 顶部距离定位的偏移位置
   */
  top: number;
  /**
   * 底部距离定位的偏移位置
   */
  bottom: number;
  /**
   * 元素的高度
   */
  height: number;
  /**
   * 元素渲染后和之前估计的高度的差值
   */
  dValue: number;
}

export default class DynamicInnerHeightList extends React.Component<
  DynamicInnerHeightListProps
> {
  state = {
    scrollTop: 0
  };

  height = this.props.userHeight;
  total = this.props.total;
  estimateRowHeight = this.props.estimateRowHeight;
  bufferSize = this.props.bufferSize || 5;

  scrollHeightContainer = React.createRef<HTMLDivElement>();

  limit = Math.ceil(this.height / this.estimateRowHeight);
  originStartIdx = 0;
  startIndex = 0;
  endIndex = Math.min(
    this.originStartIdx + this.limit + this.bufferSize,
    this.total - 1
  );

  /**
   * 用来保存每个元素渲染后的高度数据，避免重复计算
   */
  cachedPositions: CachedPosition[] = [];
  actualContentRef = React.createRef<HTMLDivElement>();
  phantomContentRef = React.createRef<HTMLDivElement>();
  phantomHeight = this.estimateRowHeight * this.total;

  worker: Worker | null = null;

  constructor(props: DynamicInnerHeightListProps) {
    super(props);
    this.worker = new Worker(new URL('./worker.ts', import.meta.url));
    this.initCachedPositions();
  }

  componentDidMount() {
    if (this.actualContentRef.current && this.total > 0) {
        this.updateCachedPositions();
    }
  }

  componentDidUpdate() {
    if (this.actualContentRef.current && this.total > 0) {
        this.updateCachedPositions();
    }
  }

  componentWillUnmount() {
      this.worker?.terminate();
  }

    initCachedPositions = () => {
        for (let i = 0; i < this.total; ++i) {
        this.cachedPositions[i] = {
            index: i,
            top: i * this.estimateRowHeight,
            bottom: (i + 1) * this.estimateRowHeight,
            height: this.estimateRowHeight,
            dValue: 0
        };
        }
    };

  /**
   * mounted以及updated之后更新元素高度数据数组
   */
  updateCachedPositions = () => {
    if (!this.actualContentRef.current) {
      return;
    }
    const nodes: NodeListOf<any> = this.actualContentRef.current.childNodes;
    const start = nodes[0];

    //计算显示的每个元素的高度的不同
    nodes.forEach((node: HTMLDivElement) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const { height } = rect;
      const index = Number(node.id.split("-")[1]);
      const oldHeight = this.cachedPositions[index].height;
      const dValue = oldHeight - height;

      if (dValue) {
        this.cachedPositions[index].bottom -= dValue;
        this.cachedPositions[index].height = height;
        this.cachedPositions[index].dValue = dValue;
      }
    });

    let startIdx = 0;
    if (start) {
      startIdx = Number(start.id.split("-")[1]);
    }

    if (this.worker) {
        this.worker.postMessage(["update", startIdx, this.cachedPositions]);
        this.worker.onmessage = (e) => {
            const [newCachedPositions, height] = e.data;
            this.phantomHeight = height;
            this.cachedPositions = newCachedPositions;

            if (this.phantomContentRef.current) {
                this.phantomContentRef.current.style.height = `${height}px`;
            }
        };
    }
  };

  /**
   * 二分法查找当前的元素
   * @param scrollTop 已滚动的距离
   */
  getStartIndex = (scrollTop = 0) => {
    let idx = binarySearch<CachedPosition, number>(
      this.cachedPositions,
      scrollTop,
      (currentValue, targetValue) => {
        const currentCompareValue = currentValue.bottom;
        if (currentCompareValue === targetValue) {
          return CompareResult.eq;
        }
        if (currentCompareValue < targetValue) {
          return CompareResult.lt;
        }

        return CompareResult.gt;
      }
    );

    const targetItem = this.cachedPositions[idx];

    //如果找到的是一个不可见的元素，则+1处理显示下一个
    if (targetItem.bottom < scrollTop) {
      idx += 1;
    }

    return idx;
  };

  onScroll = (e: any) => {
    if (e.target === this.scrollHeightContainer.current) {
      const { scrollTop } = e.target;
      const { originStartIdx, bufferSize, limit, total } = this;

      const currentIndex = this.getStartIndex(scrollTop);

      if (originStartIdx !== currentIndex) {
        this.originStartIdx = currentIndex;
        this.startIndex = Math.max(this.originStartIdx - bufferSize, 0);
        this.endIndex = Math.min(
          this.originStartIdx + limit + bufferSize,
          total - 1
        );
        this.setState({ scrollTop });
      }
    }
  };

  /**
   * 通过css控制实际渲染后的节点的偏移
   */
  getTransform = () => `
    translate3d(0, ${
      this.startIndex >= 1
        ? this.cachedPositions[this.startIndex - 1].bottom
        : 0
    }px, 0)
  `;

  renderDisplayContent = () => {
    const content: any[] = [];
    for (let i = this.startIndex; i <= this.endIndex; ++i) {
      content.push(
        this.props.rowRender(i, {
          left: 0,
          right: 0,
          width: "100%"
        })
      );
    }
    return content;
  };

  render() {
    const { height, phantomHeight, total } = this;
    const { noDataContent } = this.props;
    return (
      <div
        ref={this.scrollHeightContainer}
        style={{
          overflowX: "hidden",
          overflowY: "auto",
          height,
        //   width: 200,
          position: "relative"
        }}
        onScroll={this.onScroll}
      >
        <div
          ref={this.phantomContentRef}
          style={{ height: phantomHeight, position: "relative" }}
        />
        <div
          ref={this.actualContentRef}
          style={{
            width: "100%",
            position: "absolute",
            top: 0,
            transform: this.getTransform()
          }}
        >
          {this.renderDisplayContent()}
        </div>
        {total === 0 && (noDataContent || <div>暂无数据</div>)}
      </div>
    );
  }
}
