import { findIndex as lodashFindIndex, each as lodashEach } from 'lodash';
import {
  addLayer as addLayerSelector,
  resetLayers as resetLayersSelector,
  getLayers as getLayersSelector,
  activateLayersForEventCategory as activateLayersForEventCategorySelector
} from './selectors';

import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYER_GROUP,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  REMOVE_LAYER,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT
} from './constants';

export function resetLayers(activeString) {
  return (dispatch, getState) => {
    const { config } = getState();
    const newLayers = resetLayersSelector(
      config.defaults.startingLayers,
      config.layers
    );

    dispatch({
      type: RESET_LAYERS,
      activeString,
      layers: newLayers
    });
  };
}
export function activateLayersForEventCategory(activeLayers) {
  return (dispatch, getState) => {
    const state = getState();
    const newLayers = activateLayersForEventCategorySelector(
      activeLayers,
      state
    );

    dispatch({
      type: ADD_LAYERS_FOR_EVENT,
      activeString: state.compare.activeString,
      layers: newLayers
    });
  };
}
export function addLayer(id, spec) {
  spec = spec || {};
  return (dispatch, getState) => {
    const state = getState();
    const { layers, compare } = state;

    const activeString = compare.activeString;
    const layerObj = getLayersSelector(
      layers[activeString],
      { group: 'all' },
      state
    );
    const newLayers = addLayerSelector(
      id,
      spec,
      layers[activeString],
      layers.layerConfig,
      layerObj.overlays.length || 0
    );

    dispatch({
      type: ADD_LAYER,
      id,
      activeString,
      layers: newLayers
    });
  };
}
export function initSecondLayerGroup() {
  return {
    type: INIT_SECOND_LAYER_GROUP
  };
}
export function reorderLayers(layerArray) {
  return {
    type: REORDER_LAYER_GROUP,
    layerArray: layerArray
  };
}

export function layerHover(id, isMouseOver) {
  return {
    type: ON_LAYER_HOVER,
    id: id,
    active: isMouseOver
  };
}
export function toggleVisibility(id, visible) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isCompareA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });

    dispatch({
      type: TOGGLE_LAYER_VISIBILITY,
      id,
      index,
      visible,
      activeString
    });
  };
}
export function removeLayer(id) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.activeString;
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });
    const def = layers[activeString][index];
    if (index === -1) {
      throw new Error('Invalid layer ID: ' + id);
    }

    dispatch({
      type: REMOVE_LAYER,
      id,
      index,
      activeString,
      def
    });
  };
}
export function setOpacity(id, opacity) {
  return (dispatch, getState) => {
    const { layers, compare } = getState();
    const activeString = compare.isCompareA ? 'active' : 'activeB';
    const index = lodashFindIndex(layers[activeString], {
      id: id
    });
    if (index === -1) {
      throw new Error('Invalid layer ID: ' + id);
    }

    dispatch({
      type: UPDATE_OPACITY,
      id,
      index,
      opacity,
      activeString
    });
  };
}