import style from './App.module.css';
import { useEffect, useState } from 'react';
import { WidgetInfo } from './models/models';
import WidgetBox from './WidgetBox';



const existingWidgets = ['News Feed', 'Note', 'Poster', 'Sample Widget 1', 'Sample Widget 2', 'Sample Widget 3'];
const defaultBoxPosition = {top: 0, left: 0, width: 25, height: 25};



const Widgets = () => {
  const [widgets, setWidgets] = useState<WidgetInfo[]>([]);

  const outputWidgetsSettings = (newWidgets?: WidgetInfo[]) => { //can be called with or without new widgets info
    if (!newWidgets) console.log(widgets) // w/o parameter it outputs whatever is in component state
    else console.log(widgets) // w. parameter it outputs what you tell it to
  }

  const addWidget = async (name: string) => {
    const newWidget = {...defaultBoxPosition, name: name, zIndex: widgets.length + 1}; setWidgets([...widgets, newWidget]);
    outputWidgetsSettings([...widgets, newWidget]);
  }

  const removeWidget = (name: string) => {
    const newWidgets = widgets.filter(w => w.name !== name); setWidgets(newWidgets);
    outputWidgetsSettings(newWidgets);
  }

  const updateWidget = async (widget: WidgetInfo) => {
    const newWidgets = widgets.map(w => {
      if (w.zIndex === widgets.length && w.name !== widget.name) return ({...w, zIndex: widgets.length - 1});
      if (w.name === widget.name) return ({...widget, zIndex: widgets.length});
      return w
    })
    setWidgets(newWidgets);
  }

  const toggleWidget = (name: string) => {
    if (widgets.some(w => w.name === name)) removeWidget(name)
    else addWidget(name);
  }



  return (
    <div className={style.container}>

      <button 
        style={{position: 'absolute', top: 0, left: 0}}
        onClick={() => addWidget(`Widget ${widgets.length + 1}`)}
      >
        Click to Add widget
      </button>

      <div className={style.widgetsBox} id="widgetsBox">
        {
          widgets.map((w) => (
              <WidgetBox
                name={w.name}
                top={w.top}
                left={w.left}
                width={w.width}
                height={w.height}
                zIndex={w.zIndex}
                key={w.name}
                updateWidget={updateWidget}
                outputWidgetsSettings={outputWidgetsSettings}
              >
                {/* <div style={{width: `100%`, height: `100%`, background: `red`}} className='child'></div> */}
              </WidgetBox>
          ))
        }
      </div>

    </div>
  )
}

export default Widgets