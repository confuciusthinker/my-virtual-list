import React, { useState } from "react";
import faker from "faker";
import { Button, Modal } from "antd";
import DynamicInnerHeightList from "./components/DynamicInnerHeightList";
import FixInnerHeightList from "./components/FixInnerHeightList";

const data: any[] = [];
const dataLength = 1000;
for (let id = 0; id < dataLength; ++id) {
    data.push({
        id,
        value: faker.lorem.sentences()
    });
}

const App = () => {
    const [showFix, setShowFix] = useState(false);
    const [showDynamic, setShowDynamic] = useState(false);

    const handleFixCancel = () => {
        setShowFix(false);
    }

    const handleDynamicCancel = () => {
        setShowDynamic(false);
    }

    return (
        <>
            <div className="component-container">
                <div>
                    <Button type="primary" onClick={() => setShowFix(true)}>固定高度的虚拟滚动</Button>
                    <br />
                    <Button type="primary" onClick={() => setShowDynamic(true)}>自适应高度的虚拟滚动</Button>
                </div>
            </div>
            <Modal
                title="固定高度虚拟滚动"
                open={showFix}
                footer={null}
                onCancel={handleFixCancel}
                width={500}
                destroyOnClose
            >
                <FixInnerHeightList
                    userHeight={800}
                    total={dataLength}
                    rowHeight={90}
                    bufferSize={5}
                    rowRender={(index, styleData) => {
                        return (
                            <li key={index} style={styleData} onClick={() => console.log("item-", index)}>
                                item-{index}
                            </li>
                        );
                    }}
                />
            </Modal>
            <Modal
                title="自适应高度虚拟滚动"
                open={showDynamic}
                footer={null}
                onCancel={handleDynamicCancel}
                width={500}
                destroyOnClose
            >
                <DynamicInnerHeightList
                    userHeight={800}
                    total={dataLength}
                    estimateRowHeight={90}
                    bufferSize={5}
                    rowRender={(index, styleData) => {
                    const item = index;
                    return (
                        <div
                            key={item}
                            className="dynamic-inner-item"
                            style={styleData}
                            onClick={() => {
                                console.log("item-", index);
                            }}
                            id={`item-${index}`}
                        >
                            <span className="dynamic-inner-item-title">
                                Item - {data[index].id} Data:
                            </span>
                            <span className="dynamic-inner-item-value">
                                {data[index].value}
                            </span>
                        </div>
                    );
                    }}
                />
            </Modal>
        </>
    )
}

export default App;