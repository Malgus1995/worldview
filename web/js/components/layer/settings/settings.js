import React from 'react';
import PropTypes from 'prop-types';
import { each as lodashEach } from 'lodash';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import { connect } from 'react-redux';
import Opacity from './opacity';
import Palette from './palette';
import VectorStyle from './vector-style';
import PaletteThreshold from './palette-threshold';
import VectorFilter from './vector-filter';
import {
  getCheckerboard,
  palettesTranslate
} from '../../../modules/palettes/util';
import {
  getDefaultLegend,
  getCustomPalette,
  getPaletteLegends,
  getPalette,
  getLegend,
  isPaletteAllowed
} from '../../../modules/palettes/selectors';
import {
  setRangeAndSquash,
  setCustomPalette,
  clearCustomPalette
} from '../../../modules/palettes/actions';

import {
  getVectorStyle
} from '../../../modules/vector-styles/selectors';
import { setOpacity } from '../../../modules/layers/actions';

class LayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0
    };
    this.canvas = document.createElement('canvas');
    this.canvas.width = 120;
    this.canvas.height = 10;
    this.checkerboard = getCheckerboard();
  }
  /**
   * Render multicolormap layers inside a tab pane
   * @param {object} paletteLegends | legend object
   */
  renderMultiColormapCustoms(paletteLegends) {
    const {
      clearCustomPalette,
      getPalette,
      paletteOrder,
      getDefaultLegend,
      getCustomPalette,
      setCustomPalette,
      palettesTranslate,
      groupName,
      setRange,
      layer
    } = this.props;
    const { activeIndex } = this.state;
    let navElements = [];
    let paneElements = [];
    lodashEach(paletteLegends, (legend, i) => {
      const activeClass = activeIndex === i ? 'active' : '';
      const dualStr = paletteLegends.length === 2 ? ' dual' : '';
      const navItemEl = (
        <NavItem
          key={legend.id + 'nav'}
          className={'settings-customs-title ' + activeClass + dualStr}
        >
          <NavLink onClick={() => this.setState({ activeIndex: i })}>
            {legend.title}
          </NavLink>
        </NavItem>
      );
      let palette = getPalette(layer.id, i);
      let max = legend.colors.length - 1;
      let start = palette.min || 0;
      let end = palette.max || max;
      let paneItemEl;
      if (
        legend.type !== 'continuous' &&
        legend.type !== 'discrete' &&
        legend.colors.length > 1
      ) {
        paneItemEl = (
          <TabPane key={legend.id + 'pane'} tabId={i}>
            No customizations available for this palette.
          </TabPane>
        );
      } else {
        paneItemEl = (
          <TabPane key={legend.id + 'pane'} tabId={i}>
            {legend.type !== 'classification' ? (
              <PaletteThreshold
                legend={legend}
                setRange={setRange}
                min={0}
                max={max}
                start={start}
                groupName={groupName}
                end={end}
                layerId={layer.id}
                squashed={!!palette.squash}
                index={i}
              />
            ) : (
              ''
            )}
            <Palette
              setCustomPalette={setCustomPalette}
              groupName={groupName}
              clearCustomPalette={clearCustomPalette}
              getDefaultLegend={getDefaultLegend}
              getCustomPalette={getCustomPalette}
              palettesTranslate={palettesTranslate}
              activePalette={palette.custom || '__default'}
              checkerboard={this.checkerboard}
              layer={layer}
              canvas={this.canvas}
              index={i}
              paletteOrder={paletteOrder}
            />
          </TabPane>
        );
      }

      paneElements.push(paneItemEl);
      navElements.push(navItemEl);
    });
    return (
      <React.Fragment>
        <Nav tabs>{navElements}</Nav>
        <TabContent activeTab={activeIndex}>{paneElements}</TabContent>
      </React.Fragment>
    );
  }
  /**
   * Render Opacity, threshold, and custom palette options
   */
  renderCustomPalettes() {
    const {
      setCustomPalette,
      clearCustomPalette,
      getDefaultLegend,
      getCustomPalette,
      palettesTranslate,
      getPaletteLegends,
      getPalette,
      getPaletteLegend,
      setRange,
      paletteOrder,
      groupName,
      layer
    } = this.props;
    const paletteLegends = getPaletteLegends(layer.id);
    if (!paletteLegends) return '';
    const len = paletteLegends.length;
    const palette = getPalette(layer.id, 0);
    const legend = getPaletteLegend(layer.id, 0);
    const max = palette.legend.colors.length - 1;
    const start = palette.min || 0;
    const end = palette.max || max;
    if (len > 1) {
      return this.renderMultiColormapCustoms(paletteLegends);
    } else if (legend.type === 'classification' && legend.colors.length > 1) {
      return '';
    }

    return (
      <React.Fragment>
        {legend.type !== 'classification' &&
          <PaletteThreshold
            legend={legend}
            setRange={setRange}
            min={0}
            max={max}
            start={start}
            layerId={layer.id}
            end={end}
            squashed={!!palette.squash}
            groupName={groupName}
            index={0}
          />
        }
        <Palette
          setCustomPalette={setCustomPalette}
          clearCustom={clearCustomPalette}
          getDefaultLegend={getDefaultLegend}
          getCustomPalette={getCustomPalette}
          palettesTranslate={palettesTranslate}
          activePalette={palette.custom || '__default'}
          checkerboard={this.checkerboard}
          layer={layer}
          canvas={this.canvas}
          groupName={groupName}
          index={0}
          paletteOrder={paletteOrder}
        />
      </React.Fragment>
    );
  }
  /**
   * Render Opacity, threshold, and custom palette options
   */
  renderVectorStyles() {
    const {
      setRange,
      groupName,
      layer
    } = this.props;
    // const vectorStyle = getVectorStyle(layer.id, 0);
    const max = 100; // Placeholder
    // const start = vectorStyle.min || 0;
    const start = 0; // Placeholder
    // const end = vectorStyle.max || max;
    const end = max; // Placeholder

    return (
      <React.Fragment>
        <VectorFilter
          setRange={setRange}
          min={0}
          max={max}
          start={start}
          groupName={groupName}
          end={end}
          layerId={layer.id}
          index={0}
        />
        <VectorStyle
          activeVectorStyle={'default_style'}
          layer={layer}
          index={0}
        />
      </React.Fragment>
    );
  }
  render() {
    var renderCustomizations;
    const {
      setOpacity,
      customPalettesIsActive,
      layer,
      palettedAllowed
    } = this.props;

    if (layer.type !== 'vector') {
      renderCustomizations =
        customPalettesIsActive && palettedAllowed && layer.palette
          ? this.renderCustomPalettes()
          : '';
    } else {
      renderCustomizations = this.renderVectorStyles();
    }

    if (!layer.id) return '';
    return (
      <React.Fragment>
        <Opacity
          start={Math.ceil(layer.opacity * 100)}
          setOpacity={setOpacity}
          layer={layer}
        />
        {renderCustomizations}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { config, palettes, compare } = state;
  const { custom } = palettes;
  const groupName = compare.activeString;

  return {
    paletteOrder: config.paletteOrder,
    groupName,
    customPalettesIsActive: !!config.features.customPalettes,
    palettedAllowed: isPaletteAllowed(ownProps.layer.id, config),
    palettesTranslate,
    getDefaultLegend: (layerId, index) => {
      return getDefaultLegend(layerId, index, state);
    },
    getCustomPalette: id => {
      return getCustomPalette(id, custom);
    },
    getPaletteLegend: (layerId, index) => {
      return getPaletteLegend(layerId, index, groupName, state);
    },

    getPaletteLegends: layerId => {
      return getPaletteLegends(layerId, groupName, state);
    },
    getPalette: (layerId, index) => {
      return getPalette(layerId, index, groupName, state);
    },
    getVectorStyle: (layerId, index) => {
      return getVectorStyle(layerId, index, groupName, state);
    }
  };
}
const mapDispatchToProps = dispatch => ({
  setRange: (layerId, min, max, squash, index, groupName) => {
    dispatch(
      setRangeAndSquash(layerId, { min, max, squash }, index, groupName)
    );
  },
  setCustomPalette: (layerId, paletteId, index, groupName) => {
    dispatch(setCustomPalette(layerId, paletteId, index, groupName));
  },
  clearCustomPalette: (layerId, index, groupName) => {
    dispatch(clearCustomPalette(layerId, index, groupName));
  },
  setOpacity: (id, opacity) => {
    dispatch(setOpacity(id, opacity));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LayerSettings);

LayerSettings.defaultProps = {
  palettedAllowed: false,
  layer: { id: null, name: null },
  isOpen: false,
  title: null
};
LayerSettings.propTypes = {
  index: PropTypes.number,
  setOpacity: PropTypes.func,
  clearCustomPalette: PropTypes.func,
  getPalette: PropTypes.func,
  getVectorStyle: PropTypes.func,
  paletteOrder: PropTypes.array,
  getDefaultLegend: PropTypes.func,
  getCustomPalette: PropTypes.func,
  getPaletteLegends: PropTypes.func,
  getPaletteLegend: PropTypes.func,
  setCustomPalette: PropTypes.func,
  canvas: PropTypes.object,
  palettesTranslate: PropTypes.func,
  setRange: PropTypes.func,
  customPalettesIsActive: PropTypes.bool,
  close: PropTypes.func,
  isOpen: PropTypes.bool,
  palettedAllowed: PropTypes.bool,
  layer: PropTypes.object,
  title: PropTypes.string,
  groupName: PropTypes.string
};
