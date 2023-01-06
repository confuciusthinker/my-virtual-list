import React from "react";

export interface FixInnerHeightListProps {
    /**
     * 用户视野高度
     */
    userHeight: number;
    /**
     * 数据总数
     */
    total: number;
    /**
     * 每个item的行高
     */
    rowHeight: number;
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

export default class FixInnerHeightList extends React.Component<FixInnerHeightListProps> {
  state = { scrollTop: 0 };
  //可视范围的高度
  height = this.props.userHeight || 800;
  //数据总条数
  total = this.props.total || 1000;
  //固定的行高
  rowHeight = this.props.rowHeight || 90;
  //用来过渡快速滑动来不及渲染问题
  bufferSize = this.props.bufferSize || 5;

  //可视范围内展示的元素数
  limit = Math.ceil(this.height / this.rowHeight);
  //记录当前的真实下标
  originStartIdx = 0;
  startIndex = Math.max(this.originStartIdx - this.bufferSize, 0);
  endIndex = Math.min(
    this.originStartIdx + this.limit + this.bufferSize,
    this.total - 1
  );

  scrollContainer = React.createRef<HTMLDivElement>();

  onScroll = (e: any) => {
    if (e.target === this.scrollContainer.current) {
      const { scrollTop } = e.target;
      const { total, rowHeight, limit, originStartIdx, bufferSize } = this;

      //计算当前的startIndex
      const currentIndex = Math.floor(scrollTop / rowHeight);

      if (originStartIdx !== currentIndex) {
        this.originStartIdx = currentIndex;
        this.startIndex = Math.max(currentIndex - bufferSize, 0);
        this.endIndex = Math.min(currentIndex + limit + bufferSize, total - 1);
        this.setState({ scrollTop });
      }
    }
  };

  renderDisplayContent = () => {
    const { rowHeight } = this;
    const content: any[] = [];
    for (let i = this.startIndex; i <= this.endIndex; ++i) {
      content.push(
        this.props.rowRender(i, {
            height: rowHeight - 1 + "px",
            lineHeight: rowHeight + "px",
            left: 0,
            right: 0,
            position: "absolute",
            top: i * rowHeight,
            borderBottom: "1px solid #000",
            width: "100%"
        })
      );
    }
    return content;
  };

  render() {
    const { height, total, rowHeight } = this;
    return (
      <div
        ref={this.scrollContainer}
        style={{
          overflowX: "hidden",
          overflowY: "auto",
          height,
          backgroundColor: "#fff"
        }}
        onScroll={this.onScroll}
      >
        <div style={{ height: total * rowHeight, position: "relative" }}>
          {this.renderDisplayContent()}
        </div>
      </div>
    );
  }
}
