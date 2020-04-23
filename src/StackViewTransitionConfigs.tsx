import { Animated } from 'react-native';
import StyleInterpolator from './StackViewStyleInterpolator';
import { TransitionProps, TransitionConfig } from './types';

// These are the exact values from UINavigationController's animation configuration
const IOSTransitionSpec = {
  timing: Animated.spring,
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Standard iOS navigation transition
const SlideFromRightIOS = {
  transitionSpec: IOSTransitionSpec,
  screenInterpolator: StyleInterpolator.forHorizontal,
  containerStyleLight: {
    backgroundColor: '#eee',
  },
  containerStyleDark: {
    backgroundColor: '#000',
  },
};

const NoAnimation = {
  transitionSpec: {
    duration: 0,
    timing: Animated.timing,
  },
  screenInterpolator: StyleInterpolator.forNoAnimation,
  containerStyleLight: {
    backgroundColor: '#eee',
  },
  containerStyleDark: {
    backgroundColor: '#000',
  },
};

function defaultTransitionConfig(): TransitionConfig {
  return SlideFromRightIOS;
}

function getTransitionConfig<T = {}>(
  transitionConfigurer:
    | undefined
    | ((
        transitionProps: TransitionProps,
        prevTransitionProps?: TransitionProps,
        isModal?: boolean
      ) => T),
  transitionProps: TransitionProps,
  prevTransitionProps?: TransitionProps,
  isModal?: boolean
): TransitionConfig & T {
  const defaultConfig = defaultTransitionConfig();
  if (transitionConfigurer) {
    return {
      ...defaultConfig,
      ...transitionConfigurer(transitionProps, prevTransitionProps, isModal),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return defaultConfig as any;
}

export default {
  defaultTransitionConfig,
  getTransitionConfig,
  SlideFromRightIOS,
  NoAnimation,
};
