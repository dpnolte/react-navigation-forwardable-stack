import { NavigationRoute } from 'react-navigation';
import { NavigationStackState } from 'react-navigation-stack';

import shallowEqual from './shallowEqual';
import { Scene, SceneDescriptorMap } from './types';

const SCENE_KEY_PREFIX = 'scene_';

/**
 * Helper function to compare route keys (e.g. "9", "11").
 */
function compareKey(one: string, two: string) {
  const delta = one.length - two.length;
  if (delta > 0) {
    return 1;
  }
  if (delta < 0) {
    return -1;
  }
  return one > two ? 1 : -1;
}

/**
 * Helper function to sort scenes based on their index and view key.
 */
function compareScenes(one: Scene, two: Scene) {
  if (one.index > two.index) {
    return 1;
  }
  if (one.index < two.index) {
    return -1;
  }

  return compareKey(one.key, two.key);
}

/**
 * Whether two routes are the same.
 */
function areRoutesShallowEqual(one: NavigationRoute, two: NavigationRoute) {
  if (!one || !two) {
    return one === two;
  }

  if (one.key !== two.key) {
    return false;
  }

  return shallowEqual(one, two);
}

/**
 * Whether two routes are the same.
 */
function areScenesShallowEqual(one: Scene, two: Scene) {
  return (
    one.key === two.key &&
    one.index === two.index &&
    one.isStale === two.isStale &&
    one.isActive === two.isActive &&
    areRoutesShallowEqual(one.route, two.route)
  );
}

export default function ScenesReducer(
  scenes: Scene[],
  nextState: NavigationStackState,
  prevState: NavigationStackState | null,
  descriptors: SceneDescriptorMap
) {
  // Always update the descriptors
  // This is a workaround for https://github.com/react-navigation/react-navigation/issues/4271
  // It will be resolved in a better way when we re-write Transitioner
  scenes.forEach(scene => {
    const { route } = scene;
    if (descriptors && descriptors[route.key]) {
      // eslint-disable-next-line no-param-reassign
      scene.descriptor = descriptors[route.key];
    }
  });

  // Bail out early if we didn't update the state
  if (prevState === nextState) {
    return scenes;
  }

  const prevScenes = new Map();
  const freshScenes = new Map();
  const staleScenes = new Map();

  // Populate stale scenes from previous scenes marked as stale.
  scenes.forEach(scene => {
    const { key } = scene;
    if (scene.isStale) {
      staleScenes.set(key, scene);
    }
    prevScenes.set(key, scene);
  });

  const nextKeys = new Set();
  const nextRoutes = nextState.routes;
  // if (nextRoutes.length > nextState.index + 1) {
  //   // eslint-disable-next-line no-console
  //   console.warn('StackRouter provided invalid state, index should always be the top route');
  //   nextRoutes = nextState.routes.slice(0, nextState.index + 1);
  // }

  nextRoutes.forEach((route, index) => {
    const key = SCENE_KEY_PREFIX + route.key;

    const descriptor = descriptors && descriptors[route.key];

    const scene: Scene = {
      index,
      isActive: false,
      isStale: false,
      key,
      route,
      descriptor,
    };

    if (nextKeys.has(key)) {
      throw new Error(
        `navigation.state.routes[${index}].key "${key}" conflicts with another route!`
      );
    }

    nextKeys.add(key);

    if (staleScenes.has(key)) {
      // A previously `stale` scene is now part of the nextState, so we
      // revive it by removing it from the stale scene map.
      staleScenes.delete(key);
    }
    freshScenes.set(key, scene);
  });

  if (prevState) {
    const prevRoutes = prevState.routes;
    // if (prevRoutes.length > prevState.index + 1) {
    //   // eslint-disable-next-line no-console
    //   console.warn('StackRouter provided invalid state, index should always be the top route');
    //   prevRoutes = prevRoutes.slice(0, prevState.index + 1);
    // }
    // Look at the previous routes and classify any removed scenes as `stale`.
    prevRoutes.forEach((route, index) => {
      const key = SCENE_KEY_PREFIX + route.key;
      if (freshScenes.has(key)) {
        return;
      }
      const lastScene = scenes.find(scene => scene.route.key === route.key);

      // We can get into a weird place where we have a queued transition and then clobber
      // that transition without ever actually rendering the scene, in which case
      // there is no lastScene. If the descriptor is not available on the lastScene
      // or the descriptors prop then we just skip adding it to stale scenes and it's
      // not ever rendered.
      const descriptor = lastScene ? lastScene.descriptor : descriptors[route.key];

      if (descriptor) {
        staleScenes.set(key, {
          index,
          isActive: false,
          isStale: true,
          key,
          route,
          descriptor,
        });
      }
    });
  }

  const nextScenes: Scene[] = [];

  const mergeScene = (nextScene: Scene) => {
    const { key } = nextScene;
    const prevScene = prevScenes.has(key) ? prevScenes.get(key) : null;
    if (prevScene && areScenesShallowEqual(prevScene, nextScene)) {
      // Reuse `prevScene` as `scene` so view can avoid unnecessary re-render.
      // This assumes that the scene's navigation state is immutable.
      nextScenes.push(prevScene);
    } else {
      nextScenes.push(nextScene);
    }
  };

  staleScenes.forEach(mergeScene);
  freshScenes.forEach(mergeScene);

  nextScenes.sort(compareScenes);

  let activeScenesCount = 0;
  nextScenes.forEach((scene, ii) => {
    const isActive = !scene.isStale && scene.index === nextState.index;
    if (isActive !== scene.isActive) {
      nextScenes[ii] = {
        ...scene,
        isActive,
      };
    }
    if (isActive) {
      activeScenesCount += 1;
    }
  });

  if (activeScenesCount !== 1) {
    throw new Error(`There should always be only one scene active, not ${activeScenesCount}.`);
  }

  if (nextScenes.length !== scenes.length) {
    return nextScenes;
  }

  if (nextScenes.some((scene, index) => !areScenesShallowEqual(scenes[index], scene))) {
    return nextScenes;
  }

  // scenes haven't changed.
  return scenes;
}
