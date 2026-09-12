import { describe, expect, it } from 'vitest';
import { SceneDocument } from '../model/SceneDocument';
import { HistoryStack } from './HistoryStack';
import { SnapshotCommand, captureSnapshotCommand } from './SnapshotCommand';

describe('HistoryStack', () => {
  it('pushes, undoes, and redoes commands', () => {
    let value = 0;
    const stack = new HistoryStack();
    const cmd = {
      label: 'inc',
      execute: () => {
        value += 1;
      },
      undo: () => {
        value -= 1;
      },
    };
    stack.push(cmd);
    expect(value).toBe(1);
    expect(stack.canUndo).toBe(true);
    stack.undo();
    expect(value).toBe(0);
    expect(stack.canRedo).toBe(true);
    stack.redo();
    expect(value).toBe(1);
  });

  it('clears redo on a new push', () => {
    let value = 0;
    const stack = new HistoryStack();
    const make = (delta: number) => ({
      label: String(delta),
      execute: () => {
        value += delta;
      },
      undo: () => {
        value -= delta;
      },
    });
    stack.push(make(1));
    stack.push(make(2));
    stack.undo();
    expect(stack.canRedo).toBe(true);
    stack.push(make(10));
    expect(stack.canRedo).toBe(false);
    expect(value).toBe(11);
  });

  it('trims overflow beyond the limit', () => {
    const stack = new HistoryStack(3);
    let value = 0;
    for (let i = 0; i < 5; i++) {
      stack.push({
        label: `n${i}`,
        execute: () => {
          value += 1;
        },
        undo: () => {
          value -= 1;
        },
      });
    }
    expect(value).toBe(5);
    stack.undo();
    stack.undo();
    stack.undo();
    expect(stack.canUndo).toBe(false);
    expect(value).toBe(2);
  });
});

describe('SnapshotCommand with SceneDocument', () => {
  it('undoes shape move and wall add', () => {
    const doc = new SceneDocument();
    const history = new HistoryStack();

    const addShape = captureSnapshotCommand(doc, 'add shape', () => {
      doc.addShape('cube', { position: { x: 0, z: 0 } });
    });
    history.pushExecuted(addShape);

    const addWall = captureSnapshotCommand(doc, 'add wall', () => {
      doc.addWall({ start: { x: 0, z: 0 }, end: { x: 3, z: 0 } });
    });
    history.pushExecuted(addWall);

    const shape = doc.list()[0]!;
    const move = captureSnapshotCommand(doc, 'move', () => {
      doc.moveShape(shape.id, 2, 1);
    });
    history.pushExecuted(move);

    expect(doc.listWalls()).toHaveLength(1);
    expect(doc.get(shape.id)?.position.x).toBe(2);

    history.undo();
    expect(doc.get(shape.id)?.position.x).toBe(0);
    history.undo();
    expect(doc.listWalls()).toHaveLength(0);
    history.redo();
    expect(doc.listWalls()).toHaveLength(1);
  });

  it('SnapshotCommand execute restores after state', () => {
    const doc = new SceneDocument();
    doc.addShape('cube');
    const before = doc.toSnapshot();
    doc.addWall({ start: { x: 0, z: 0 }, end: { x: 1, z: 0 } });
    const after = doc.toSnapshot();
    const cmd = new SnapshotCommand('wall', doc, before, after);
    cmd.undo();
    expect(doc.listWalls()).toHaveLength(0);
    cmd.execute();
    expect(doc.listWalls()).toHaveLength(1);
  });
});
