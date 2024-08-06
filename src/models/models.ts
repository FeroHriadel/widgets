export interface WidgetPosition {
  top: number, 
  left: number, 
  width: number, 
  height: number,
}

export interface WidgetInfo extends WidgetPosition {
  name: string;
  zIndex: number;
}