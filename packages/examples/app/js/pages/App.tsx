import '/css/global.scss';

import * as styles from '/css/App.module.scss';

import { Button, Result, Space } from 'antd';
import { Item, useVirtual } from 'use-virtual';
import { getRandomInt } from '/js/utils/getRandom';
import React, { memo, useCallback, useRef } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

const rowCount = 500;
const colCount = 100;
const rowBaseSize = 32;
const colBaseSize = 96;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const { stack, message } = error;

    if (stack != null) {
      return stack?.replace(/(\r?\n)\s{2,}/gm, '$1  ');
    }

    return message;
  }

  return `${error}`;
}

const rowSizes = new Array(rowCount).fill(rowBaseSize).map(() => {
  return getRandomInt(rowBaseSize, 40);
});

const colSizes = new Array(colCount).fill(colBaseSize).map(() => {
  return getRandomInt(colBaseSize, 152);
});

interface RowProps {
  row: Item;
  cols: readonly Item[];
  measureColInRowIndex: number;
}

const GridRow = memo(({ row, cols, measureColInRowIndex }: RowProps) => {
  const rowHeight = rowSizes[row.index];

  return (
    <div ref={row.ref} className={styles.row} style={{ height: rowHeight }}>
      {cols.map(col => (
        <div
          key={col.index}
          className={styles.cell}
          ref={row.index === measureColInRowIndex ? col.ref : void 0}
          style={{
            height: rowHeight,
            width: colSizes[col.index],
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
  const [height, rows, { scrollToItem: scrollToRow }] = useVirtual({
    count: rowCount,
    size: rowBaseSize,
    viewport: () => viewportRef.current
  });

  const [width, cols, { scrollToItem: scrollToCol }] = useVirtual({
    count: colCount,
    horizontal: true,
    size: colBaseSize,
    viewport: () => viewportRef.current
  });

  const measureColInRowIndex = rows[0]?.index ?? 0;

  const onScrollToRow = useCallback(() => {
    scrollToRow({
      align: 'center',
      index: (Math.random() * rowCount) | 0
    });
  }, []);

  const onScrollToCol = useCallback(() => {
    scrollToCol({
      align: 'center',
      index: (Math.random() * colCount) | 0
    });
  }, []);

  return (
    <>
      <div ref={viewportRef} className={styles.viewport}>
        <div role="grid" className={styles.grid} style={{ width, height }}>
          <div
            className={styles.inner}
            style={{
              transform: `translate3d(${cols[0]?.start ?? 0}px, ${rows[0]?.start ?? 0}px, 0)`
            }}
          >
            {rows.map((row: Item) => (
              <GridRow key={row.index} row={row} cols={cols} measureColInRowIndex={measureColInRowIndex} />
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
              {getErrorMessage(error)}
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
