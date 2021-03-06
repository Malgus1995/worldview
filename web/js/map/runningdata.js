import util from '../util/util';
import {
  get as lodashGet,
  isEmpty as lodashIsEmpty,
  isEqual as lodashIsEqual
} from 'lodash';
import { getPalette } from '../modules/palettes/selectors';
import {
  runningData as runningDataAction,
  clearRunningData as clearRunningDataAction
} from '../modules/map/actions';
import {
  isFromActiveCompareRegion
} from '../modules/compare/util';
export function MapRunningData(models, compareUi, store) {
  var self;

  self = this;
  var dataObj = {};
  /**
   * Clear running data value
   */
  self.clearAll = function() {
    if (!lodashIsEmpty(dataObj)) {
      dataObj = {};
      store.dispatch(clearRunningDataAction());
    }
  };
  /*
   * Compare old and new arrays to determine which Layers need to be
   * removed
   *
   * @method LayersToRemove
   *
   * @param {Array} pixels - Array of pixels values
   *
   * @param {Object} map - OpenLayers Map Object
   *
   * @return {Void}
   *
   */
  self.newPoint = function(pixels, map) {
    const state = store.getState();
    const activeLayerObj = {};
    const [lon, lat] = map.getCoordinateFromPixel(pixels);
    let swipeOffset;
    if (compareUi && state.compare.active) {
      swipeOffset = Math.floor(compareUi.getOffset());
    }

    if (!(lon < -180 || lon > 180 || lat < -90 || lat > 90)) {
      map.forEachFeatureAtPixel(pixels, (feature, layer) => {
        if (!layer.wv || !layer.wv.def || !isFromActiveCompareRegion(map, pixels, layer.wv, state.compare, swipeOffset)) return;
        let color;
        const def = layer.wv.def;
        const identifier = def.palette.styleProperty;
        const layerId = def.id;
        const paletteLegends = getPalette(layerId, undefined, undefined, state);
        const legend = paletteLegends.legend;

        if (!identifier && legend.colors.length > 1) return;
        if (identifier) {
          const properties = feature.getProperties();
          const value = properties[identifier] || def.palette.unclassified;
          if (!value) return;
          const tooltips = legend.tooltips.map(c => c.toLowerCase().replace(/\s/g, ''));
          const colorIndex = tooltips.indexOf(value.toLowerCase().replace(/\s/g, ''));
          color = legend.colors[colorIndex];
        } else if (legend.colors.length === 1) {
          color = legend.colors[0];
        }
        activeLayerObj[layerId] = {
          paletteLegends,
          paletteHex: color
        };
      });
    }
    map.forEachLayerAtPixel(pixels, function(layer, data) {
      if (!layer.wv) return;
      const { def } = layer.wv;
      if (!isFromActiveCompareRegion(map, pixels, layer.wv, state.compare, swipeOffset)) return;
      if (def.palette && !lodashGet(layer, 'wv.def.disableHoverValue')) {
        activeLayerObj[def.id] = {
          paletteLegends: getPalette(def.id, undefined, undefined, state),
          paletteHex: util.rgbaToHex(data[0], data[1], data[2], data[3])
        };
      }
    });
    if (!lodashIsEqual(activeLayerObj, dataObj)) {
      dataObj = activeLayerObj;
      store.dispatch(runningDataAction(dataObj));
    }
  };
  return self;
}
