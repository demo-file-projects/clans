import * as React from "react";

import type {RenderItemDto} from "../../../pkg";

import type {ControlsManager} from "../../manager";

import {defaultMapSize} from "../utils";
import {generateMapTileId} from "./utils";
import {Column2d} from "./column";

import "./index.less";

interface ITile {
  id: string;
  glyph: string;
  x: number;
  y: number;
  isVisible: boolean;
  progress?: number;
}

enum RenderDataKeys {
  map = "map",
  buildings = "buildings",
  units = "units",
  preview = "preview",
  selection = "selection",
}

type RendererData = Map<string, ITile>;

type RendererCollectionData = Map<RenderDataKeys, RendererData>;

interface IProps {
  controls: ControlsManager;
}

interface IState {
  tiles: ITile[][];
  columns: number;
  rows: number;
}

export class Renderer2D extends React.PureComponent<IProps, IState> {

  private tiles: RendererCollectionData; 

  constructor(props: IProps) {
    super(props);
    
    this.tiles = new Map();
    this.tiles.set(RenderDataKeys.map, new Map());
    this.tiles.set(RenderDataKeys.buildings, new Map());
    this.tiles.set(RenderDataKeys.units, new Map());
    this.tiles.set(RenderDataKeys.preview, new Map());
    this.tiles.set(RenderDataKeys.selection, new Map());

    let size = defaultMapSize();

    this.state = {
      columns: size.width, 
      rows: size.height,
      tiles: [[]],
    };
  }

  private getRenderDataContainer(key: RenderDataKeys): RendererData {
    let collection = this.tiles.get(key);

    if (collection == null) {
      throw new Error("Collection does not include key " + key);
    }
    
    return collection;
  }

  public handleMapData(_: string, item: RenderItemDto, isVisible: boolean) {
    let container = this.getRenderDataContainer(RenderDataKeys.map); 
    let id = generateMapTileId(item.x, item.y);
    let match = container.get(id);          

    if (match == null) {
      return container.set(id, {
        id,
        glyph: item.glyph,
        x: item.x,
        y: item.y,
        isVisible
      });
    }
    
    match.glyph = item.glyph;
    match.x = item.x;
    match.y = item.y;
    match.isVisible = isVisible;
  }

  public handleBuildingData(id: string, item: RenderItemDto, progress: number) {
    let container = this.getRenderDataContainer(RenderDataKeys.buildings); 
    let match = container.get(id);          
    
    if (match == null) {
      return container.set(id, {
        id, 
        glyph: item.glyph,
        x: item.x,
        y: item.y,
        isVisible: true,
        progress
      });
    }
    
    match.glyph = item.glyph;
    match.x = item.x;
    match.y = item.y;
    match.progress = progress;
  }

  public handleUnitData(id: string, item: RenderItemDto) {
    let container = this.getRenderDataContainer(RenderDataKeys.units); 
    let match = container.get(id);          
    
    if (match == null) {
      return container.set(id, {
        id,
        glyph: item.glyph,
        x: item.x,
        y: item.y,
        isVisible: true,
      });
    }
    
    match.glyph = item.glyph;
    match.x = item.x;
    match.y = item.y;
  }

  public handlePreviewData(item: RenderItemDto) {
    let container = this.getRenderDataContainer(RenderDataKeys.preview); 

    if (item == null) {
      return container.clear();
    }
    
    let id = "preview"
    let match = container.get(id);          

    if (match == null) {
      return container.set(id, {
        id, 
        glyph: item.glyph,
        x: item.x,
        y: item.y,
        isVisible: true,
      });
    }

    match.glyph = item.glyph;
    match.x = item.x;
    match.y = item.y;
  }

  public handleSelectionData(item: RenderItemDto) {
    let container = this.getRenderDataContainer(RenderDataKeys.selection); 

    if (item == null) {
      return container.clear();
    }
    
    let id = "selection"
    let match = container.get(id);          

    if (match == null) {
      return container.set(id, {
        id, 
        glyph: item.glyph,
        x: item.x,
        y: item.y,
        isVisible: true,
      });
    }

    match.glyph = item.glyph;
    match.x = item.x;
    match.y = item.y;
  }

  public handleRenderCycleCompleted() {
    let collection = new Map<string, ITile>();
    
    this.tiles.get(RenderDataKeys.map).forEach((data, key) => {
      collection.set(key, data);
    });

    this.tiles.get(RenderDataKeys.units).forEach((data) => {
      collection.set(generateMapTileId(data.x, data.y), data); 
    });

    this.tiles.get(RenderDataKeys.buildings).forEach((data) => {
      collection.set(generateMapTileId(data.x, data.y), data); 
    });

    this.tiles.get(RenderDataKeys.preview).forEach((data) => {
      collection.set(generateMapTileId(data.x, data.y), data); 
    })

    this.tiles.get(RenderDataKeys.selection).forEach((data) => {
      collection.set(generateMapTileId(data.x, data.y), data); 
    });

    let tiles = [[]] as ITile[][]; 
    let index = 0;
    let current = 0;
    
    collection.forEach((data) => {
      
      if (index == this.state.columns) {
        index = 0;
        tiles.push([]);
        current = tiles.length - 1;
      }

      tiles[current].push(data);
      index++;
    });

    this.setState((state) => ({
      ...state, tiles,
    }));
  }

  private handleClick = (x: number, y: number) => {
    this.props.controls.setLeftMouseButtonUpEvent(x, y);
  }

  public render(): JSX.Element {
    const {columns, rows} = this.state;
    const containerWidth = columns * (Column2d.width + Column2d.padding * 2);
    const containerHeight = rows * (Column2d.height + Column2d.padding * 2);
    const columnHeight = Column2d.height + Column2d.padding * 2;

    return (
      <div className="renderer-2d">
        <div className="wrapper" style={{width: containerWidth, height: containerHeight}}>
          {this.state.tiles.map((rows, id) =>
            <div key={id} className="grid-row-2d" style={{height: columnHeight}}>
              {rows.map((column) => <Column2d 
                key={column.id}
                id={column.id}
                glyph={column.glyph}
                x={column.x}
                y={column.y} 
                isVisible={column.isVisible}
                onClick={this.handleClick}
              />)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
