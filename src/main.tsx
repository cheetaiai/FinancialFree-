import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Fix for React issue #11538:
// "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
// This happens when Google Chrome Translate, Grammarly, or other browser extensions wrap or alter text nodes with <font> tags.
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        try {
          return child.parentNode.removeChild(child) as T;
        } catch {
          // Suppress translation / extension DOM mismatch crash
        }
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        try {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
        } catch {
          // Suppress translation / extension DOM mismatch crash
        }
      }
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

// Handle and suppress benign Vite HMR / sandbox iframe WebSocket errors & skipped ViewTransitions
if (typeof window !== 'undefined') {
  const isBenignNoise = (msg: string) => {
    return (
      msg.includes('WebSocket') ||
      msg.includes('closed without opened') ||
      msg.includes('vite') ||
      msg.includes('connection to') ||
      msg.includes('ResizeObserver') ||
      msg.includes('Transition was skipped') ||
      msg.includes('ViewTransition') ||
      msg.includes('AbortError')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (isBenignNoise(msg)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || String(event?.error?.message || event || '');
    if (isBenignNoise(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  const prevOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = String(message || '') + ' ' + String(error?.message || '');
    if (isBenignNoise(msg)) {
      return true;
    }
    if (prevOnError) {
      return prevOnError(message, source, lineno, colno, error);
    }
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

