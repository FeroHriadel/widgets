import style from './WidgetBox.module.css';

import { WidgetInfo } from './models/models';
import { useState, useRef, Children } from 'react';



interface Props extends WidgetInfo {
  updateWidget: (widget: WidgetInfo) => void;
  outputWidgetsSettings: () => void;
  children?: React.ReactNode;
}



/*
* To ensure responsiveness widget (box) values are in per cent (relative to parent container);
* the `// util functions:` section converts px to % relative to parent
* in all other sections each value is in % relative to parent container, unless specifically stated otherwise.
*/



const WidgetBox = ({ name, top, left, width, height, zIndex, updateWidget, outputWidgetsSettings, children } : Props) => {
  // values:
  const boxRef = useRef<HTMLDivElement>(null);
  const [canDrag, setCanDrag] = useState(false);
  const [canResize, setCanResize] = useState(false);
  const [boxGrabPercentage, setBoxGrabPercentage] = useState<{x: number, y: number} | null>(null); //mousedown from box.x & box.y distances as percentage of box width
  const minBoxSize = 10; //10% of parent container
  const snapToEndSize = 2; //at 98% width or height the box snaps to 100% so user doesn't have to fiddle around
  


  // util functions:
  // convert px to per cent relative to parent container
  const pxYToPercent = (px: number) => {
    if (!boxRef.current) throw new Error('Could not find the box element');
    const parent = boxRef.current.parentElement; if (!parent) throw new Error('Could not find parent');
    const parentRect = parent?.getBoundingClientRect();
    const percent = 100 * px / parentRect.height;
    return percent;
  }

  const pxXToPercent = (px: number) => {
    if (!boxRef.current) throw new Error('Could not find the box element');
    const parent = boxRef.current.parentElement; if (!parent) throw new Error('Could not find parent');
    const parentRect = parent?.getBoundingClientRect();
    const percent = 100 * px / parentRect.width;
    return percent;
  }

  const getMouseRelativeToParent = (e: any) => {
    if (!boxRef.current) throw new Error('Could not find the box element');
    const parent = boxRef.current.parentElement; if (!parent) throw new Error('Could not find parent');
    const parentRect = parent?.getBoundingClientRect();
    const mouseX = e.clientX - parentRect.left;
    const mouseY = e.clientY - parentRect.top;
    return {mouseX: pxXToPercent(mouseX), mouseY: pxYToPercent(mouseY)};
  }

  const getBoxRelativeToParent = () => {
    if (!boxRef.current) throw new Error('Could not find the box element');
    const parent = boxRef.current.parentElement; if (!parent) throw new Error('Could not find parent');
    const parentRect = parent?.getBoundingClientRect();
    const boxRect = boxRef.current.getBoundingClientRect();
    const yRelativeToParent = boxRect.top - parentRect.top;
    const xRelativeToParent = boxRect.x - parentRect.x;
    return {x: pxXToPercent(xRelativeToParent), y: pxYToPercent(yRelativeToParent), width: pxXToPercent(boxRect.width), height: pxYToPercent(boxRect.height)}
  }

  const saveBoxGrabPercentage = (e: any) => { //saves at what x & y percentage (relative to box) user started dragging the box.
    const { mouseX, mouseY } = getMouseRelativeToParent(e);
    const { width: boxWidth, height: boxHeight, x: boxX, y: boxY } = getBoxRelativeToParent();
    const mouseDistanceFromBoxStartX = mouseX - boxX;
    const mouseDistanceFromBoxStartY = mouseY - boxY;
    const boxClickedAtItsXPercent = mouseDistanceFromBoxStartX / boxWidth * 100;
    const boxClickedAtItsYPercent = mouseDistanceFromBoxStartY / boxHeight * 100;
    setBoxGrabPercentage({x: boxClickedAtItsXPercent, y: boxClickedAtItsYPercent});
  }

  const boxPercentageIntoParentPercentage = () => {
      if (!boxGrabPercentage) throw new Error('No boxGrabPercentage');
      if (!boxRef.current) throw new Error('Could not find the box element');
      const parent = boxRef.current.parentElement; if (!parent) throw new Error('Could not find parent');
      const parentRect = parent?.getBoundingClientRect();
      const boxRect = boxRef.current.getBoundingClientRect();
      const boxDraggedAtPxX = boxGrabPercentage.x / 100 * boxRect.width;
      const boxDraggedAtPxY = boxGrabPercentage.y / 100 * boxRect.height;
      const boxPercToParentPercX = boxDraggedAtPxX / parentRect.width * 100;
      const boxPercToParentPercY = boxDraggedAtPxY / parentRect.height * 100; 
      return {x: boxPercToParentPercX, y: boxPercToParentPercY};
  }



  // drag widget functions:
  const disableDrag = () => { setCanDrag(false); };

  const enableDrag = () => { setCanDrag(true); };

  const clearBoxGrabPercentage = () => { setBoxGrabPercentage(null); };

  const handleMouseDown = (e: any) => { enableDrag(); saveBoxGrabPercentage(e); };

  const handleMouseLeave = () => { 
    disableDrag(); 
    clearBoxGrabPercentage(); 
    if (canResize) outputWidgetsSettings();
  }; 
  
  const handleMouseUp = () => { disableDrag(); clearBoxGrabPercentage(); outputWidgetsSettings(); };

  const handleWidgetMove = (e: any) => {
    if (!canDrag) return;
    const { x: offsetX, y: offsetY } = boxPercentageIntoParentPercentage();
    const { mouseX, mouseY } = getMouseRelativeToParent(e);
    const { width: boxWidth, height: boxHeight, x: boxX, y: boxY } = getBoxRelativeToParent();
    let newX = Math.max(mouseX - offsetX, 0); if (newX + boxWidth > 100) newX = 100 - boxWidth; //box cannot go beyond parent container width
    let newY = Math.max(mouseY - offsetY, 0); if (newY + boxHeight > 100) newY = 100 - boxHeight; //box cannot go beyond parent container height
    updateWidget({left: newX, top: newY, height, width, name, zIndex});
  }


  // resize widget functions:
  const getResizeRightValues = (e: any) => {
    let { mouseX } = getMouseRelativeToParent(e);
    const { x } = getBoxRelativeToParent();
    if (mouseX < x + minBoxSize) mouseX = x + minBoxSize;
    if (mouseX > 100 - snapToEndSize) mouseX = 100;
    let newWidth = mouseX - x;
    return { newWidth };
  }

  const getResizeLeftValues = (e: any) => {
    let { mouseX } = getMouseRelativeToParent(e);
    const { width, x } = getBoxRelativeToParent();
    if (mouseX < snapToEndSize) mouseX = 0;
    if (mouseX > x + width - minBoxSize) mouseX = x + width - minBoxSize;
    let newWidth = x + width - mouseX;
    return { newLeft: mouseX, newWidth }
  }

  const getResizeUpValues = (e: any) => {
    let { mouseY } = getMouseRelativeToParent(e);
    const { height, y } = getBoxRelativeToParent();
    if (mouseY < snapToEndSize) mouseY = 0;
    if (mouseY > y + height - minBoxSize) mouseY = y + height - minBoxSize;
    let newHeight = y + height - mouseY;
    return { newHeight, newTop: mouseY };
  }

  const getResizeDownValues = (e: any) => {
    let { mouseY } = getMouseRelativeToParent(e);
    const { y } = getBoxRelativeToParent();
    if (mouseY > 100 - snapToEndSize) mouseY = 100;
    if (mouseY < y + minBoxSize) mouseY = y + minBoxSize;
    let newHeight = mouseY - y;
    return { newHeight };
  }

  //resize on the right
  const enableRightResize = () => { 
    setCanResize(true); 
    const rightResizerEl = document.getElementById(`${name}-rightResizer`);
    rightResizerEl!.style.width = '200px';
    rightResizerEl!.style.right = '-100px';
  };

  const disableRightResize = () => { 
    setCanResize(false); 
    const rightResizerEl = document.getElementById(`${name}-rightResizer`);
    rightResizerEl!.style.width = '20px';
    rightResizerEl!.style.right = '0px';
  };

  const initResizeRight = (e: any) => {
    e.stopPropagation();
    enableRightResize();
  }

  const resizeRight = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newWidth } = getResizeRightValues(e);
    updateWidget({left, top, width: newWidth, height, zIndex, name});
  }

  // resize on the left
  const enableLeftResize = () => { 
    setCanResize(true); 
    const leftResizerEl = document.getElementById(`${name}-leftResizer`);
    leftResizerEl!.style.width = '200px';
    leftResizerEl!.style.left = '-100px';
  };

  const disableLeftResize = () => { 
    setCanResize(false); 
    const leftResizerEl = document.getElementById(`${name}-leftResizer`);
    leftResizerEl!.style.width = '20px';
    leftResizerEl!.style.left = '0px';
  };

  const initResizeLeft = (e: any) => {
    e.stopPropagation();
    enableLeftResize();
  }

  const resizeLeft = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newLeft, newWidth } = getResizeLeftValues(e);
    updateWidget({left: newLeft, top, width: newWidth, height, zIndex, name});
  }

  //resize up
  const enableResizeUp = () => { 
    setCanResize(true); 
    const upperResizerEl = document.getElementById(`${name}-upperResizer`);
    upperResizerEl!.style.height = '200px';
    upperResizerEl!.style.top = '-100px';
  };

  const disableResizeUp = () => { 
    setCanResize(false); 
    const upperResizerEl = document.getElementById(`${name}-upperResizer`);
    upperResizerEl!.style.height = '20px';
    upperResizerEl!.style.top = '0px';
  };

  const initResizeUp = (e: any) => {
    e.stopPropagation();
    enableResizeUp();
  }

  const resizeUp = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newHeight, newTop } = getResizeUpValues(e);
    updateWidget({left, top: newTop, width, height: newHeight, zIndex, name});
  }


  //resize down
  const enableResizeDown = () => { 
    setCanResize(true); 
    const upperResizerEl = document.getElementById(`${name}-lowerResizer`);
    upperResizerEl!.style.height = '200px';
    upperResizerEl!.style.bottom = '-100px';
  };

  const disableResizeDown = () => { 
    setCanResize(false); 
    const upperResizerEl = document.getElementById(`${name}-lowerResizer`);
    upperResizerEl!.style.height = '20px';
    upperResizerEl!.style.bottom = '0px';
  };

  const initResizeDown = (e: any) => {
    e.stopPropagation();
    enableResizeDown();
  }

  const resizeDown = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newHeight } = getResizeDownValues(e);
    updateWidget({left, top, width, height: newHeight, zIndex, name});
  }

  //resize right up
  const enableResizeRightUp = () => {
    setCanResize(true);
    const upperRightResizerEl = document.getElementById(`${name}-upperRightResizer`);
    upperRightResizerEl!.style.height = '200px';
    upperRightResizerEl!.style.width = '200px';
    upperRightResizerEl!.style.right = '-100px';
    upperRightResizerEl!.style.top = '-100px';
  };

  const disableResizeRightUp = () => {
    setCanResize(false);
    const upperRightResizerEl = document.getElementById(`${name}-upperRightResizer`);
    upperRightResizerEl!.style.height = '20px';
    upperRightResizerEl!.style.width = '20px';
    upperRightResizerEl!.style.right = '0px';
    upperRightResizerEl!.style.top = '0px';
  };
  
  const initResizeRightUp = (e: any) => {
    e.stopPropagation();
    enableResizeRightUp();
  }

  const resizeRightUp = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newHeight, newTop } = getResizeUpValues(e);
    const { newWidth } = getResizeRightValues(e);
    updateWidget({left, top: newTop, width: newWidth, height: newHeight, zIndex, name});
  }

  // resize down right
  const enableResizeDownRight = () => {
    setCanResize(true);
    const lowerRightResizerEl = document.getElementById(`${name}-lowerRightResizer`);
    lowerRightResizerEl!.style.height = '200px';
    lowerRightResizerEl!.style.width = '200px';
    lowerRightResizerEl!.style.bottom = '-100px';
    lowerRightResizerEl!.style.right = '-100px';
  };

  const disableResizeDownRight = () => {
    setCanResize(false);
    const lowerRightResizerEl = document.getElementById(`${name}-lowerRightResizer`);
    lowerRightResizerEl!.style.height = '20px';
    lowerRightResizerEl!.style.width = '20px';
    lowerRightResizerEl!.style.bottom = '0px';
    lowerRightResizerEl!.style.right = '0px';
  };

  const initResizeDownRight = (e: any) => {
    e.stopPropagation();
    enableResizeDownRight();
  }

  const resizeDownRight = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newHeight } = getResizeDownValues(e);
    const { newWidth } = getResizeRightValues(e);
    updateWidget({left, top, width: newWidth, height: newHeight, zIndex, name});
  }

  // resize down left
  const enableResizeDownLeft = () => {
    setCanResize(true);
    const lowerLeftResizerEl = document.getElementById(`${name}-lowerLeftResizer`);
    lowerLeftResizerEl!.style.height = '200px';
    lowerLeftResizerEl!.style.width = '200px';
    lowerLeftResizerEl!.style.bottom = '-100px';
    lowerLeftResizerEl!.style.left = '-100px';
  };

  const disableResizeDownLeft = () => {
    setCanResize(false);
    const lowerLeftResizerEl = document.getElementById(`${name}-lowerLeftResizer`);
    lowerLeftResizerEl!.style.height = '20px';
    lowerLeftResizerEl!.style.width = '20px';
    lowerLeftResizerEl!.style.bottom = '0px';
    lowerLeftResizerEl!.style.left = '0px';
  };

  const initResizeDownLeft = (e: any) => {
    e.stopPropagation();
    enableResizeDownLeft();
  }

  const resizeDownLeft = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newHeight } = getResizeDownValues(e);
    const { newLeft, newWidth } = getResizeLeftValues(e);
    updateWidget({left: newLeft, top, width: newWidth, height: newHeight, zIndex, name})
  }
  
  // resize left up
  const enableResizeLeftUp = () => {
    setCanResize(true);
    const upperLeftResizer = document.getElementById(`${name}-upperLeftResizer`);
    upperLeftResizer!.style.height = '200px';
    upperLeftResizer!.style.width = '200px';
    upperLeftResizer!.style.left = '-100px';
    upperLeftResizer!.style.top = '-100px';
  }

  const disableResizeLeftUp = () => {
    setCanResize(false);
    const upperLeftResizerEl = document.getElementById(`${name}-upperLeftResizer`);
    upperLeftResizerEl!.style.height = '20px';
    upperLeftResizerEl!.style.width = '20px';
    upperLeftResizerEl!.style.left = '0px';
    upperLeftResizerEl!.style.top = '0px';
  }

  const initResizeLeftUp = (e: any) => {
    e.stopPropagation();
    enableResizeLeftUp();
  }

  const resizeLeftUp = (e: any) => {
    e.stopPropagation();
    if (!canResize) return;
    const { newHeight, newTop } = getResizeUpValues(e);
    const { newLeft, newWidth } = getResizeLeftValues(e);
    updateWidget({left: newLeft, top: newTop, width: newWidth, height: newHeight, zIndex, name});
  }



  // render
  return (
    <div
      ref={boxRef}
      className={style.box} 
      id={name} 
      style={{height: `${height}%`, width: `${width}%`, top: `${top}%`, left: `${left}%`, zIndex: `${zIndex}`}}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave }
      onMouseUp={handleMouseUp}
      onMouseMove={handleWidgetMove}
    >
      {
        children
        ?
        children
        :
        <div className={style.content}> <p>{name}</p> </div>
      }
      <div 
        className={style.rightResizer} 
        id={`${name}-rightResizer`}
        onMouseDown={initResizeRight} 
        onMouseMove={resizeRight} 
        onMouseLeave={disableRightResize}
        onMouseUp={disableRightResize}
      />
      <div 
        className={style.leftResizer} 
        id={`${name}-leftResizer`}
        onMouseDown={initResizeLeft} 
        onMouseMove={resizeLeft} 
        onMouseLeave={disableLeftResize}
        onMouseUp={disableLeftResize}
      />
      <div 
        className={style.upperResizer} 
        id={`${name}-upperResizer`}
        onMouseDown={initResizeUp} 
        onMouseMove={resizeUp} 
        onMouseLeave={disableResizeUp}
        onMouseUp={disableResizeUp}
      />
      <div 
        className={style.lowerResizer} 
        id={`${name}-lowerResizer`}
        onMouseDown={initResizeDown} 
        onMouseMove={resizeDown} 
        onMouseLeave={disableResizeDown}
        onMouseUp={disableResizeDown}
      />
      <div 
        className={style.upperRightResizer}
        id={`${name}-upperRightResizer`}
        onMouseDown={initResizeRightUp}
        onMouseMove={resizeRightUp}
        onMouseLeave={disableResizeRightUp}
        onMouseUp={disableResizeRightUp}
      />
      <div 
        className={style.lowerRightResizer}
        id={`${name}-lowerRightResizer`}
        onMouseDown={initResizeDownRight}
        onMouseMove={resizeDownRight}
        onMouseLeave={disableResizeDownRight}
        onMouseUp={disableResizeDownRight}
      />
      <div 
        className={style.lowerLeftResizer}
        id={`${name}-lowerLeftResizer`}
        onMouseDown={initResizeDownLeft}
        onMouseMove={resizeDownLeft}
        onMouseLeave={disableResizeDownLeft}
        onMouseUp={disableResizeDownLeft}
      />
      <div 
        className={style.upperLeftResizer}
        id={`${name}-upperLeftResizer`}
        onMouseDown={initResizeLeftUp}
        onMouseMove={resizeLeftUp}
        onMouseLeave={disableResizeLeftUp}
        onMouseUp={disableResizeLeftUp}
      />
    </div>
  )
}

export default WidgetBox