import { Animated, ViewStyle, StyleProp } from 'react-native';
import { NavigationRoute, NavigationDescriptor, NavigationParams } from 'react-navigation';
import { NavigationStackProp, NavigationStackOptions } from 'react-navigation-stack';

export type TransitionerLayout = {
  height: Animated.Value;
  width: Animated.Value;
  initHeight: number;
  initWidth: number;
  isMeasured: boolean;
};

export type TransitionProps = {
  layout: TransitionerLayout;
  navigation: NavigationStackProp;
  position: Animated.Value;
  scenes: Scene[];
  scene: Scene;
  index: number;
  hasPreviousScene: boolean;
  hasNextScene: boolean;
};

export type SceneDescriptorMap = {
  [key: string]: NavigationDescriptor<
    NavigationParams,
    NavigationStackOptions,
    NavigationStackProp
  >;
};

export type Scene = {
  key: string;
  index: number;
  isStale: boolean;
  isActive: boolean;
  route: NavigationRoute;
  descriptor: NavigationDescriptor<NavigationParams, NavigationStackOptions>;
};

export type Transition = { scene: Scene; navigation: NavigationStackProp };

export type HeaderMode = 'float' | 'screen' | 'none';

export type SceneInterpolatorProps = {
  mode?: HeaderMode;
  layout: TransitionerLayout;
  scene: Scene;
  scenes: Scene[];
  position: Animated.AnimatedInterpolation;
  navigation: NavigationStackProp;
  shadowEnabled?: boolean;
  cardOverlayEnabled?: boolean;
};

export type SceneInterpolator = (props: SceneInterpolatorProps) => any;

export type TransitionConfig = {
  transitionSpec: {
    timing: Function;
  };
  screenInterpolator: SceneInterpolator;
  containerStyle?: StyleProp<ViewStyle>;
  containerStyleLight?: StyleProp<ViewStyle>;
  containerStyleDark?: StyleProp<ViewStyle>;
};

export type HeaderTransitionConfig = {
  headerLeftInterpolator?: SceneInterpolator;
  headerLeftLabelInterpolator?: SceneInterpolator;
  headerLeftButtonInterpolator?: SceneInterpolator;
  headerTitleFromLeftInterpolator?: SceneInterpolator;
  headerTitleInterpolator?: SceneInterpolator;
  headerRightInterpolator?: SceneInterpolator;
  headerBackgroundInterpolator?: SceneInterpolator;
  headerLayoutInterpolator?: SceneInterpolator;
};
