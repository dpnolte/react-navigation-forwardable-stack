import { I18nManager } from 'react-native';
import getSceneIndicesForInterpolationInputRange from './getSceneIndicesForInterpolationInputRange';
import { SceneInterpolatorProps } from './types';

const EPS = 1e-5;

/**
 * Utility that builds the style for the card in the cards stack.
 *
 *     +------------+
 *   +-+            |
 * +-+ |            |
 * | | |            |
 * | | |  Focused   |
 * | | |   Card     |
 * | | |            |
 * +-+ |            |
 *   +-+            |
 *     +------------+
 */

/**
 * Render the initial style when the initial layout isn't measured yet.
 */
function forInitial(props: SceneInterpolatorProps) {
  const { navigation, scene } = props;

  const focused = navigation.state.index === scene.index;
  const opacity = focused ? 1 : 0;
  // If not focused, move the scene far away.
  const translate = focused ? 0 : 1000000;
  return {
    opacity,
    transform: [{ translateX: translate }, { translateY: translate }],
  };
}

/**
 * Standard iOS-style slide in from the right.
 */
function forHorizontal(props: SceneInterpolatorProps) {
  const { layout, position, scene } = props;

  if (!layout.isMeasured) {
    return forInitial(props);
  }
  const interpolate = getSceneIndicesForInterpolationInputRange(props);
  if (!interpolate) return { opacity: 0 };

  const { first, last } = interpolate;
  const { index } = scene;

  const width = layout.initWidth;

  const translateX = position.interpolate({
    inputRange: [first, index, last],
    outputRange: I18nManager.isRTL ? [-width, 0, width] : [width, 0, -width],
    extrapolate: 'clamp',
  });

  // eslint-disable-next-line no-underscore-dangle
  // console.log('forHorizontal', [first, index, last], (translateX as any).__getValue());

  const shadowOpacity = props.shadowEnabled
    ? position.interpolate({
        inputRange: [first, index, last],
        outputRange: [0, 0.7, 0],
        extrapolate: 'clamp',
      })
    : null;

  const overlayOpacity = props.cardOverlayEnabled
    ? position.interpolate({
        inputRange: [index, last - 0.5, last, last + EPS],
        outputRange: [0, 0.07, 0.07, 0],
        extrapolate: 'clamp',
      })
    : null;

  return {
    transform: [{ translateX }],
    overlayOpacity,
    shadowOpacity,
  };
}

function forNoAnimation() {
  return {};
}

// only support horizontal

export default {
  forHorizontal,
  forNoAnimation,
};
