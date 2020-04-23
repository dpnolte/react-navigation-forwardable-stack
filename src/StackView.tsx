import * as React from 'react';
import { Platform } from 'react-native';
import { StackActions } from 'react-navigation';
import { NavigationStackProp, NavigationStackConfig } from 'react-navigation-stack';
import { SceneDescriptorMap, Transition, TransitionProps } from './types';
import StackViewLayout from './StackViewLayout';
import Transitioner from './Transitioner';
import StackViewTransitionConfigs from './StackViewTransitionConfigs';

type Props = {
  navigation: NavigationStackProp;
  descriptors: SceneDescriptorMap;
  navigationConfig: NavigationStackConfig;
  onTransitionStart?: () => void;
  onTransitionEnd?: (transition: Transition, lastTransition?: Transition) => void;
  onGestureBegin?: () => void;
  onGestureCanceled?: () => void;
  onGestureEnd?: () => void;
  screenProps?: unknown;
};

const USE_NATIVE_DRIVER = Platform.OS === 'android' || Platform.OS === 'ios';

// NOTE(brentvatne): this was previously in defaultProps, but that is deceiving
// because the entire object will be clobbered by navigationConfig that is
// passed in.
const DefaultNavigationConfig = {
  mode: 'card' as const,
  cardShadowEnabled: true,
  cardOverlayEnabled: false,
};

class StackView extends React.Component<Props> {
  componentDidMount() {
    const { navigation } = this.props;
    if (navigation.state.isTransitioning) {
      navigation.dispatch(
        StackActions.completeTransition({
          key: navigation.state.key,
        })
      );
    }
  }

  private configureTransition = (
    transitionProps: TransitionProps,
    prevTransitionProps?: TransitionProps
  ) => {
    const { navigationConfig } = this.props;

    return {
      useNativeDriver: USE_NATIVE_DRIVER,
      ...StackViewTransitionConfigs.getTransitionConfig(
        navigationConfig.transitionConfig,
        transitionProps,
        prevTransitionProps,
        navigationConfig.mode === 'modal'
      ).transitionSpec,
    };
  };

  private getShadowEnabled = () => {
    const { navigationConfig } = this.props;
    return navigationConfig && navigationConfig.cardShadowEnabled
      ? navigationConfig.cardShadowEnabled
      : DefaultNavigationConfig.cardShadowEnabled;
  };

  private getCardOverlayEnabled = () => {
    const { navigationConfig } = this.props;
    return navigationConfig && navigationConfig.cardOverlayEnabled
      ? navigationConfig.cardOverlayEnabled
      : DefaultNavigationConfig.cardOverlayEnabled;
  };

  private renderStackviewLayout = (
    transitionProps: TransitionProps,
    lastTransitionProps?: TransitionProps
  ) => {
    const { screenProps, navigationConfig } = this.props;
    return (
      <StackViewLayout
        {...navigationConfig}
        cardShadowEnabled={this.getShadowEnabled()}
        cardOverlayEnabled={this.getCardOverlayEnabled()}
        onGestureBegin={this.props.onGestureBegin}
        onGestureCanceled={this.props.onGestureCanceled}
        onGestureEnd={this.props.onGestureEnd}
        screenProps={screenProps}
        transitionProps={transitionProps}
        lastTransitionProps={lastTransitionProps}
      />
    );
  };

  private handleTransitionEnd = (transition: Transition, lastTransition?: Transition) => {
    const {
      navigationConfig,
      navigation,
      onTransitionEnd = navigationConfig.onTransitionEnd,
    } = this.props;
    const transitionDestKey = transition.scene.route.key;
    const isCurrentKey = navigation.state.routes[navigation.state.index].key === transitionDestKey;
    if (transition.navigation.state.isTransitioning && isCurrentKey) {
      navigation.dispatch(
        StackActions.completeTransition({
          key: navigation.state.key,
          toChildKey: transitionDestKey,
        })
      );
    }
    if (onTransitionEnd) {
      onTransitionEnd(transition, lastTransition);
    }
  };

  render() {
    return (
      <Transitioner
        render={this.renderStackviewLayout}
        configureTransition={this.configureTransition}
        screenProps={this.props.screenProps}
        navigation={this.props.navigation}
        descriptors={this.props.descriptors}
        onTransitionStart={
          this.props.onTransitionStart || this.props.navigationConfig.onTransitionStart
        }
        onTransitionEnd={this.handleTransitionEnd}
      />
    );
  }
}

export default StackView;
