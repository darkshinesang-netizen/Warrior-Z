import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_TAB_ORDER,
  backFromFormation,
  completeAdventureBattle,
  createInitialNavigationState,
  exitAdventureBattleToStoryMap,
  goToAdventureHub,
  openAdventureFormation,
  openAdventureStoryMap,
  selectPrimaryTab,
  startAdventureBattle,
} from './navigation';

test('primary navigation contains exactly the 6 required tabs in exact order without battle', () => {
  assert.deepEqual(PRIMARY_TAB_ORDER, [
    'home',
    'adventure',
    'adventurers',
    'summon',
    'growth',
    'bag',
  ]);
  assert.equal((PRIMARY_TAB_ORDER as readonly string[]).includes('battle'), false);
});

test('full Adventure Story flow transitions Home -> Adventure Hub -> Story Map -> Formation -> Battle -> Result -> Story Map', () => {
  let nav = createInitialNavigationState();
  assert.equal(nav.primaryTab, 'home');
  assert.equal(nav.adventureRoute, 'hub');

  nav = selectPrimaryTab(nav, 'adventure');
  assert.equal(nav.primaryTab, 'adventure');
  assert.equal(nav.adventureRoute, 'hub');

  nav = openAdventureStoryMap(nav);
  assert.equal(nav.adventureRoute, 'story-map');

  nav = openAdventureFormation(nav, '1-6');
  assert.equal(nav.adventureRoute, 'formation');
  assert.equal(nav.selectedStageId, '1-6');

  nav = startAdventureBattle(nav, '1-6', 'session-1');
  assert.equal(nav.adventureRoute, 'battle');
  assert.equal(nav.activeBattleSessionId, 'session-1');

  nav = completeAdventureBattle(nav);
  assert.equal(nav.adventureRoute, 'result');

  nav = exitAdventureBattleToStoryMap(nav);
  assert.equal(nav.adventureRoute, 'story-map');
  assert.equal(nav.activeBattleSessionId, null);
});

test('backing out of Formation returns to Story Map, and exiting Battle returns to Story Map (never Home)', () => {
  let nav = openAdventureFormation(createInitialNavigationState(), '1-6');
  nav = backFromFormation(nav);
  assert.equal(nav.primaryTab, 'adventure');
  assert.equal(nav.adventureRoute, 'story-map');

  nav = startAdventureBattle(nav, '1-6', 'session-2');
  nav = exitAdventureBattleToStoryMap(nav);
  assert.equal(nav.primaryTab, 'adventure');
  assert.equal(nav.adventureRoute, 'story-map');
  assert.equal(nav.activeBattleSessionId, null);
});

test('switching primary tabs away from an active Battle safely cancels session and avoids battle duplication on return', () => {
  let nav = startAdventureBattle(createInitialNavigationState(), '1-6', 'session-live');
  nav = selectPrimaryTab(nav, 'summon');
  assert.equal(nav.primaryTab, 'summon');
  assert.equal(nav.adventureRoute, 'story-map');
  assert.equal(nav.activeBattleSessionId, null);

  nav = selectPrimaryTab(nav, 'adventure');
  assert.equal(nav.primaryTab, 'adventure');
  assert.equal(nav.adventureRoute, 'story-map');
  assert.equal(nav.activeBattleSessionId, null);

  nav = goToAdventureHub(nav);
  assert.equal(nav.adventureRoute, 'hub');
});
