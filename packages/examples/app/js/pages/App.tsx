import '/css/global.scss';

import * as styles from '/css/App.module.scss';

import { Button, Result, Space } from 'antd';
import { Item, useVirtual } from 'use-virtual';
import { getRandomInt } from '/js/utils/getRandom';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import React, { memo, useCallback, useRef } from 'react';

const rowCount = 1000;
const colCount = 300;
const rowBaseSize = 64;
const colBaseSize = 160;
const rowSizes = new Array(rowCount).fill(rowBaseSize).map(() => getRandomInt(rowBaseSize, 120));
const colSizes = new Array(colCount).fill(colBaseSize).map(() => getRandomInt(colBaseSize, 240));

interface RowProps {
  row: Item;
  cols: readonly Item[];
  measureCols: boolean;
}

const GridRow = memo(({ row, cols, measureCols }: RowProps) => {
  return (
    <div ref={row.ref} className={styles.row} style={{ height: rowSizes[row.index] }}>
      {cols.map(col => (
        <div
          key={col.index}
          ref={measureCols ? col.ref : void 0}
          className={styles.cell}
          style={{
            width: colSizes[col.index],
            height: row.size,
            background: (row.index + col.index) % 2 === 0 ? '#f5f8ff' : '#eef3ff'
          }}
        >
          R{row.index} × C{col.index}
        </div>
      ))}
    </div>
  );
});

const VirtualGrid = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [gridHeight, rows, { scrollToItem: scrollToRow }] = useVirtual({
    count: rowCount,
    overscan: 6,
    size: (index: number) => rowSizes[index],
    viewport: () => viewportRef.current
  });
  const [gridWidth, cols, { scrollToItem: scrollToCol }] = useVirtual({
    horizontal: true,
    count: colCount,
    overscan: 4,
    size: (index: number) => colSizes[index],
    viewport: () => viewportRef.current
  });

  const onScrollToRow = useCallback(() => {
    scrollToRow({
      index: (Math.random() * rowCount) | 0,
      align: 'center',
      smooth: false
    });
  }, []);

  const onScrollToCol = useCallback(() => {
    scrollToCol({
      index: (Math.random() * colCount) | 0,
      align: 'center',
      smooth: false
    });
  }, []);

  return (
    <>
      <div ref={viewportRef} className={styles.viewport}>
        <div role="grid" className={styles.grid} style={{ width: gridWidth, height: gridHeight }}>
          <div
            className={styles.inner}
            style={{
              transform: `translate3d(${cols[0]?.start ?? 0}px, ${rows[0]?.start ?? 0}px, 0)`
            }}
          >
            {rows.map((row: Item) => (
              <GridRow key={row.index} row={row} cols={cols} measureCols={row.index === rows[0]?.index} />
            ))}
          </div>
        </div>
      </div>
      <Space className={styles.action}>
        <Button type="primary" onClick={onScrollToRow}>
          滚动到随机行
        </Button>
        <Button type="primary" onClick={onScrollToCol}>
          滚动到随机列
        </Button>
      </Space>
    </>
  );
};

const ErrorFallback = memo(function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  if (__DEV__) {
    return (
      <Result
        status="error"
        title="页面错误"
        extra={
          <Button type="primary" onClick={resetErrorBoundary}>
            重试页面
          </Button>
        }
        subTitle={
          <div style={{ display: 'flex', margin: '24px 0 0', justifyContent: 'center' }}>
            <pre style={{ fontFamily: 'monospace', color: '#f00', padding: 0, margin: 0, textAlign: 'left' }}>
              {(error as Error).stack}
            </pre>
          </div>
        }
      />
    );
  }

  return (
    <Result
      status="error"
      title="页面错误"
      extra={
        <Button type="primary" onClick={resetErrorBoundary}>
          重试页面
        </Button>
      }
      subTitle="抱歉，发生错误，无法渲染页面，请联系系统管理员或者重试页面！"
    />
  );
});

export default memo(function App(): React.ReactElement {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={styles.app}>
        <VirtualGrid />
      </div>
    </ErrorBoundary>
  );
});
