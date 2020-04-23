import * as React from 'react';
import { Animated, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import { Screen } from 'react-native-screens';
import { ThemeContext, ThemeColors } from 'react-navigation';

import createPointerEventsContainer, {
  InputProps,
  InjectedProps,
} from './createPointerEventsContainer';

type Props = InputProps &
  InjectedProps & {
    focusedIndex: number;
    style: StyleProp<ViewStyle>;
    animatedStyle: any;
    position: Animated.AnimatedInterpolation;
    transparent?: boolean;
    children: React.ReactNode;
  };

function getAccessibilityProps(isActive: boolean) {
  if (Platform.OS === 'ios') {
    return {
      accessibilityElementsHidden: !isActive,
    };
  }
  if (Platform.OS === 'android') {
    return {
      importantForAccessibility: isActive ? 'yes' : 'no-hide-descendants',
    };
  }
  return {};
}

const EPS = 1e-5;

/**
 * Component that renders the scene as card for the <StackView />.
 */
class Card extends React.Component<Props> {
  // eslint-disable-next-line react/static-property-placement
  static contextType = ThemeContext;

  // eslint-disable-next-line react/static-property-placement
  context!: React.ContextType<typeof ThemeContext>;

  render() {
    const {
      children,
      pointerEvents,
      style,
      transparent,
      focusedIndex,
      position,
      scene: { index, isActive },
    } = this.props;

    let active: number | Animated.AnimatedInterpolation = 0;

    if (transparent || isActive || focusedIndex === index) {
      active = 1;
      // next scene
    } else if (focusedIndex < index) {
      active = position.interpolate({
        inputRange: [focusedIndex, focusedIndex + EPS, index],
        outputRange: [0, 1, 1],
        extrapolate: 'clamp',
      });
      // previous scene
    } else if (focusedIndex > index) {
      active = position.interpolate({
        inputRange: [index, index + 1 - EPS, index + 1],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
      });
    }

    // animatedStyle can be `false` if there is no screen interpolator
    const animatedStyle = this.props.animatedStyle || {};

    const { shadowOpacity, overlayOpacity, ...containerAnimatedStyle } = animatedStyle;

    const flattenedStyle = StyleSheet.flatten(style) || {};
    const { backgroundColor, ...screenStyle } = flattenedStyle;
    const isDark = this.context === 'dark';
    let baseCardStyle;

    if (isDark) {
      baseCardStyle = transparent ? styles.transparentDark : styles.cardDark;
    } else {
      baseCardStyle = transparent ? styles.transparentLight : styles.cardLight;
    }

    return (
      <Screen
        pointerEvents={pointerEvents}
        onComponentRef={this.props.onComponentRef}
        style={[containerAnimatedStyle, screenStyle]}
        active={active as any}
        stackPresentation="push"
      >
        {!transparent && shadowOpacity ? (
          <Animated.View style={[styles.shadow, { shadowOpacity }]} pointerEvents="none" />
        ) : null}
        <Animated.View
          {...getAccessibilityProps(isActive)}
          style={[
            baseCardStyle,
            backgroundColor && backgroundColor !== 'transparent' ? { backgroundColor } : null,
          ]}
        >
          {children}
        </Animated.View>
        {overlayOpacity ? (
          <Animated.View
            pointerEvents="none"
            style={[isDark ? styles.overlayDark : styles.overlayLight, { opacity: overlayOpacity }]}
          />
        ) : null}
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  cardLight: {
    flex: 1,
    backgroundColor: ThemeColors.light.body,
  },
  cardDark: {
    flex: 1,
    backgroundColor: ThemeColors.dark.body,
  },
  overlayLight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  // TODO: what should shadow be styled like?
  shadow: {
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    position: 'absolute',
    backgroundColor: '#fff',
    shadowOffset: { width: -1, height: 1 },
    shadowRadius: 5,
    shadowColor: '#000',
  },
  transparentLight: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  transparentDark: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default createPointerEventsContainer(Card);
