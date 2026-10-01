import { useRef, useState } from 'react';


export function useSingleFileDrop(onFileChange) {
  const inputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const resetDragState = () => {
    dragDepthRef.current = 0;
    setDragOver(false);
  };

  const selectFirstFile = (files) => {
    const file = Array.from(files || [])[0];
    if (file) onFileChange(file);
  };

  const dropTargetProps = {
    onDragEnter: (event) => {
      event.preventDefault();
      dragDepthRef.current += 1;
      setDragOver(true);
    },
    onDragOver: (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    },
    onDragLeave: (event) => {
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setDragOver(false);
    },
    onDrop: (event) => {
      event.preventDefault();
      selectFirstFile(event.dataTransfer.files);
      resetDragState();
    },
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      inputRef.current?.click();
    },
  };

  const handleInputChange = (event) => {
    selectFirstFile(event.target.files);
    event.target.value = '';
  };

  return {
    dragOver,
    dropTargetProps,
    handleInputChange,
    inputRef,
  };
}
