import { Platform } from 'react-native';
import {
  createNavigator,
  StackRouter,
  NavigationRouteConfigMap,
  NavigationRoute,
  NavigationStackRouterConfig,
  CreateNavigatorConfig,
  NavigationAction,
  NavigationNavigator,
  NavigationProp,
  NavigationState,
  StackActions,
  NavigationActions,
} from 'react-navigation';
import {
  NavigationStackConfig,
  NavigationStackOptions,
  NavigationStackProp,
  NavigationStackState,
} from 'react-navigation-stack';

import StackView from './StackView';

type RouteMapConfig = NavigationRouteConfigMap<
  NavigationStackOptions,
  NavigationStackProp<NavigationRoute, any>
>;

interface NavState extends NavigationStackState {
  hasNextRoute?: boolean;
  currentRouteKey?: string | null;
}

export type ForwardableRoute<Params = any> = Omit<
  NavigationRoute<Params>,
  'routes' | 'isTransitioning' | 'index'
> & {
  isNextRoute?: boolean;
  androidDisableHardwareAcceleration?: boolean;
};

export type AddNextRouteHandler<Params = any> = (state: NavState) => ForwardableRoute | undefined;
export type DisableHardwareAccelerationHandler<Params = any> = (route: ForwardableRoute) => boolean;

type StackConfig = CreateNavigatorConfig<
  NavigationStackConfig,
  NavigationStackRouterConfig,
  NavigationStackOptions,
  NavigationStackProp<NavigationRoute, any>
>;

/**
 * Adaptation from https://github.com/react-navigation/stack/tree/v1.10.3
 * so that we can have next routes that the can swipe to
 */
export const createForwadableStack = (
  routeConfigMap: RouteMapConfig,
  addNextRouteIfAny: AddNextRouteHandler,
  stackConfig?: StackConfig,
  androidDisableHardwareAccelerationHandler?: DisableHardwareAccelerationHandler
) => {
  const router = StackRouter(routeConfigMap, stackConfig);

  const ForwadableStackNavigator = createNavigator(StackView as any, router, stackConfig);

  ForwadableStackNavigator.router = {
    ...router,
    getStateForAction: (action: NavigationAction, lastState: NavState) => {
      const nextState = router.getStateForAction(action, lastState) as NavState;

      const currentRoute = nextState.routes[nextState.routes.length - 1] as ForwardableRoute;
      nextState.currentRouteKey = currentRoute.key;

      if (androidDisableHardwareAccelerationHandler && Platform.OS === 'android') {
        currentRoute.androidDisableHardwareAcceleration = androidDisableHardwareAccelerationHandler(
          currentRoute
        );
      }

      if (relevantActionTypes.has(action.type)) {
        // add a forwardable route if any
        const nextRoute = addNextRouteIfAny(nextState);
        if (nextRoute) {
          nextState.hasNextRoute = true;

          currentRoute.isNextRoute = false;
          nextRoute.isNextRoute = true;

          if (androidDisableHardwareAccelerationHandler && Platform.OS === 'android') {
            nextRoute.androidDisableHardwareAcceleration = androidDisableHardwareAccelerationHandler(
              nextRoute
            );
          }

          nextState.routes.push((nextRoute as unknown) as NavigationRoute);
        }
      }
      // console.log(action, nextState, lastState);
      return nextState;
    },
  };

  return ForwadableStackNavigator;
};

const relevantActionTypes = new Set<string>([
  StackActions.POP,
  StackActions.POP_TO_TOP,
  StackActions.PUSH,
  StackActions.REPLACE,
  StackActions.RESET,
  NavigationActions.BACK,
  NavigationActions.NAVIGATE,
]);

/**
 * This creates a createNavigator as per react-navigation api
 */
export const createForwadableStackCreator = (
  addNextRouteIfAny: AddNextRouteHandler
): ((
  routeConfigMap: RouteMapConfig,
  stackConfig?: StackConfig
) => NavigationNavigator<any, NavigationProp<NavigationState>>) => {
  return (routeConfigMap: RouteMapConfig, stackConfig?: StackConfig) => {
    return createForwadableStack(routeConfigMap, addNextRouteIfAny, stackConfig);
  };
};
