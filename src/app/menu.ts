// ============================================================================
// Minesweeper Infinite - Menu du Démineur
// ----------------------------------------------------------------------------
// Ce fichier construit et synchronise les menus Game et Help. Il délègue les
// actions de jeu au contrôleur appelant.
// ============================================================================
import type { Difficulty } from '../core/types';
import type { BoardLayout } from '../canvas/layout';
import type { GridZoom } from './MinesweeperCanvasController';
import checkedIcon from '../ui/assets/checked.png';

interface MenuActions {
  readonly onNewGame: () => void;
  readonly onChangeDifficulty: (difficulty: Difficulty) => void;
  readonly onToggleMarks?: (enabled: boolean) => void;
  readonly onToggleColor?: (enabled: boolean) => void;
  readonly onToggleSound?: (enabled: boolean) => void;
  readonly onFillToWindow?: () => void;
  readonly onChangeZoom?: (zoom: GridZoom) => void;
  readonly onBestTimes?: () => void;
  readonly onOpenContentsHelp?: () => void;
  readonly onSearchHelp?: () => void;
  readonly onUsingHelp?: () => void;
  readonly onAbout?: () => void;
  readonly onGithub?: () => void;
  readonly onExit?: () => void;
}

interface MenuOptions {
  readonly initialDifficulty: Difficulty;
  readonly initialMarksEnabled?: boolean;
  readonly initialColorEnabled?: boolean;
  readonly initialSoundEnabled?: boolean;
  readonly initialZoom?: GridZoom;
}

export interface MenuSession {
  readonly dispose: () => void;
  readonly setDifficulty: (difficulty: Difficulty) => void;
  readonly setMarksEnabled: (enabled: boolean) => void;
  readonly setColorEnabled: (enabled: boolean) => void;
  readonly setSoundEnabled: (enabled: boolean) => void;
  readonly setZoom: (zoom: GridZoom) => void;
  readonly setLayout: (layout: BoardLayout) => void;
}

// Constante `MENU_MARKS` utilisée par la responsabilité de ce module.
const MENU_MARKS = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Expert: 'Expert',
} as const;

// ----------------------------------------------------------------------------
// Formate difficulté label.
//
// Paramètres :
// - difficulty : valeur fournie au traitement.
//
// Retour :
// - valeur de type `string` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function formatDifficultyLabel(difficulty: Difficulty): string {
  return MENU_MARKS[difficulty];
}

// ----------------------------------------------------------------------------
// Crée minesweeper menu.
//
// Paramètres :
// - root : valeur fournie au traitement.
// - actions : valeur fournie au traitement.
// - options : valeur fournie au traitement.
//
// Retour :
// - valeur de type `MenuSession` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function createMinesweeperMenu(root: HTMLElement, actions: MenuActions, options: MenuOptions): MenuSession {
  let currentDifficulty = options.initialDifficulty;
  let marksEnabled = options.initialMarksEnabled ?? true;
  let colorEnabled = options.initialColorEnabled ?? false;
  let soundEnabled = options.initialSoundEnabled ?? true;
  let currentZoom = options.initialZoom ?? 1;
  let openedMenu: 'game' | 'help' | null = null;

  // Constante `menu` utilisée par la responsabilité de ce module.
  const menu = document.createElement('div');
  menu.className = 'ms-menu';
  menu.style.left = '0px';
  menu.style.top = '0px';

  // Constante `topBar` utilisée par la responsabilité de ce module.
  const topBar = document.createElement('div');
  topBar.className = 'ms-menu__topbar';

  // Constante `gameButton` utilisée par la responsabilité de ce module.
  const gameButton = document.createElement('div');
  gameButton.className = 'ms-menu__item';
  gameButton.textContent = 'Game';

  // Constante `helpButton` utilisée par la responsabilité de ce module.
  const helpButton = document.createElement('div');
  helpButton.className = 'ms-menu__item';
  helpButton.textContent = 'Help';

  // Constante `gamePanel` utilisée par la responsabilité de ce module.
  const gamePanel = document.createElement('div');
  gamePanel.className = 'ms-menu__panel ms-menu__panel--game';
  gamePanel.style.left = '0px';
  gamePanel.style.top = '20px';
  gamePanel.style.display = 'none';

  // Constante `helpPanel` utilisée par la responsabilité de ce module.
  const helpPanel = document.createElement('div');
  helpPanel.className = 'ms-menu__panel ms-menu__panel--help';
  helpPanel.style.top = '20px';
  helpPanel.style.display = 'none';

  // ----------------------------------------------------------------------------
  // Définit opened.
  //
  // Paramètres :
  // - name : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const setOpened = (name: 'game' | 'help' | null): void => {
    openedMenu = name;
    gamePanel.style.display = name === 'game' ? 'grid' : 'none';
    helpPanel.style.display = name === 'help' ? 'grid' : 'none';

    gameButton.classList.toggle('is-open', name === 'game');
    helpButton.classList.toggle('is-open', name === 'help');
  };

  // ----------------------------------------------------------------------------
  // Définit ligne contenu.
  //
  // Paramètres :
  // - row : valeur fournie au traitement.
  // - label : valeur fournie au traitement.
  // - checked : valeur fournie au traitement.
  // - hotkey : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const setRowContent = (row: HTMLElement, label: string, checked = false, hotkey = ''): void => {
    // Constante `check` utilisée par la responsabilité de ce module.
    const check = document.createElement('span');
    check.className = 'ms-menu__check';
    if (checked) {
      // Constante `image` utilisée par la responsabilité de ce module.
      const image = document.createElement('img');
      image.src = checkedIcon;
      image.alt = '';
      check.appendChild(image);
    }
    // Constante `text` utilisée par la responsabilité de ce module.
    const text = document.createElement('span');
    text.className = 'ms-menu__label';
    text.textContent = label;
    // Constante `shortcut` utilisée par la responsabilité de ce module.
    const shortcut = document.createElement('span');
    shortcut.className = 'ms-menu__hotkey';
    shortcut.textContent = hotkey;
    // Constante `arrow` utilisée par la responsabilité de ce module.
    const arrow = document.createElement('span');
    arrow.className = 'ms-menu__arrow';
    row.replaceChildren(check, text, shortcut, arrow);
  };

  // ----------------------------------------------------------------------------
  // Crée ligne.
  //
  // Paramètres :
  // - text : valeur fournie au traitement.
  // - action : valeur fournie au traitement.
  // - isDisabled : valeur fournie au traitement.
  //
  // Retour :
  // - valeur de type `HTMLDivElement` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const createRow = (text: string, action?: () => void, isDisabled = false): HTMLDivElement => {
    // Constante `row` utilisée par la responsabilité de ce module.
    const row = document.createElement('div');
    row.className = 'ms-menu__row';
    row.setAttribute('aria-disabled', `${isDisabled}`);
    if (action) {
      row.addEventListener(
        'click',
        // ----------------------------------------------------------------------------
        // Exécute le callback associé à add event listener.
        //
        // Paramètres :
        // - event : valeur fournie au traitement.
        //
        // Effets de bord :
        // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
        // ----------------------------------------------------------------------------
        (event) => {
          event.preventDefault();
          action();
          setOpened(null);
        },
      );
    }
    setRowContent(row, text);
    return row;
  };

  // ----------------------------------------------------------------------------
  // Crée toggle ligne.
  //
  // Paramètres :
  // - label : valeur fournie au traitement.
  // - checked : valeur fournie au traitement.
  // - action : valeur fournie au traitement.
  //
  // Retour :
  // - valeur de type `HTMLDivElement` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const createToggleRow = (label: string, checked: boolean, action: (next: boolean) => void): HTMLDivElement => {
    // Constante `row` utilisée par la responsabilité de ce module.
    const row = createRow(
      label,
      // ----------------------------------------------------------------------------
      // Crée ligne callback.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      () => {
        // Constante `next` utilisée par la responsabilité de ce module.
        const next = !checked;
        checked = next;
        action(next);
        syncState();
      },
    );
    row.dataset.toggle = label;
    setRowContent(row, label, checked);
    return row;
  };

  // ----------------------------------------------------------------------------
  // Crée difficulté ligne.
  //
  // Paramètres :
  // - difficulty : valeur fournie au traitement.
  //
  // Retour :
  // - valeur de type `HTMLDivElement` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const createDifficultyRow = (difficulty: Difficulty): HTMLDivElement => {
    // Constante `row` utilisée par la responsabilité de ce module.
    const row = createRow(
      formatDifficultyLabel(difficulty),
      // ----------------------------------------------------------------------------
      // Crée ligne callback.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      () => {
        currentDifficulty = difficulty;
        actions.onChangeDifficulty(difficulty);
      },
      false,
    );
    row.dataset.difficulty = difficulty;
    setRowContent(row, formatDifficultyLabel(difficulty), difficulty === currentDifficulty);
    return row;
  };

  // Constante `newRow` utilisée par la responsabilité de ce module.
  const newRow = createRow(
    'New',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onNewGame();
    },
  );
  setRowContent(newRow, 'New', false, 'F2');
  // Constante `beginnerRow` utilisée par la responsabilité de ce module.
  const beginnerRow = createDifficultyRow('Beginner');
  // Constante `intermediateRow` utilisée par la responsabilité de ce module.
  const intermediateRow = createDifficultyRow('Intermediate');
  // Constante `expertRow` utilisée par la responsabilité de ce module.
  const expertRow = createDifficultyRow('Expert');
  // Constante `separator1` utilisée par la responsabilité de ce module.
  const separator1 = document.createElement('div');
  separator1.className = 'ms-menu__separator';

  gamePanel.appendChild(newRow);
  gamePanel.appendChild(separator1);
  gamePanel.appendChild(beginnerRow);
  gamePanel.appendChild(intermediateRow);
  gamePanel.appendChild(expertRow);

  // Constante `fillToWindowRow` utilisée par la responsabilité de ce module.
  const fillToWindowRow = createRow(
    'Fit to window',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onFillToWindow?.();
      setOpened(null);
    },
  );

  // ----------------------------------------------------------------------------
  // Crée zoom ligne.
  //
  // Paramètres :
  // - zoom : valeur fournie au traitement.
  //
  // Retour :
  // - valeur de type `HTMLDivElement` produite par le traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const createZoomRow = (zoom: GridZoom): HTMLDivElement => {
    // Constante `label` utilisée par la responsabilité de ce module.
    const label = `Zoom ${zoom}x`;
    // Constante `row` utilisée par la responsabilité de ce module.
    const row = createRow(
      label,
      // ----------------------------------------------------------------------------
      // Crée ligne callback.
      //
      // Effets de bord :
      // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
      // ----------------------------------------------------------------------------
      () => {
        currentZoom = zoom;
        actions.onChangeZoom?.(zoom);
        syncZoomState();
      },
    );
    row.dataset.zoom = `${zoom}`;
    setRowContent(row, label, zoom === currentZoom);
    return row;
  };

  // Constante `zoom1Row` utilisée par la responsabilité de ce module.
  const zoom1Row = createZoomRow(1);
  // Constante `zoom15Row` utilisée par la responsabilité de ce module.
  const zoom15Row = createZoomRow(1.5);
  // Constante `zoom2Row` utilisée par la responsabilité de ce module.
  const zoom2Row = createZoomRow(2);

  // Constante `marksRow` utilisée par la responsabilité de ce module.
  const marksRow = createToggleRow(
    'Marks (?)',
    marksEnabled,
    // ----------------------------------------------------------------------------
    // Crée toggle ligne callback.
    //
    // Paramètres :
    // - next : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (next) => {
      marksEnabled = next;
      actions.onToggleMarks?.(next);
    },
  );

  // Constante `colorRow` utilisée par la responsabilité de ce module.
  const colorRow = createToggleRow(
    'Color',
    colorEnabled,
    // ----------------------------------------------------------------------------
    // Crée toggle ligne callback.
    //
    // Paramètres :
    // - next : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (next) => {
      colorEnabled = next;
      actions.onToggleColor?.(next);
    },
  );

  // Constante `soundRow` utilisée par la responsabilité de ce module.
  const soundRow = createToggleRow(
    'Sound',
    soundEnabled,
    // ----------------------------------------------------------------------------
    // Crée toggle ligne callback.
    //
    // Paramètres :
    // - next : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (next) => {
      soundEnabled = next;
      actions.onToggleSound?.(next);
    },
  );

  // Constante `scoresRow` utilisée par la responsabilité de ce module.
  const scoresRow = createRow(
    'Best Times...',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onBestTimes?.();
      setOpened(null);
    },
  );

  // Constante `exitRow` utilisée par la responsabilité de ce module.
  const exitRow = createRow(
    'Exit',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onExit?.();
      setOpened(null);
    },
  );

  gamePanel.appendChild(fillToWindowRow);
  gamePanel.appendChild(separator1.cloneNode(true));
  [zoom1Row, zoom15Row, zoom2Row].forEach(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à for each.
    //
    // Paramètres :
    // - row : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `HTMLDivElement` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (row) => gamePanel.appendChild(row),
  );
  gamePanel.appendChild(separator1.cloneNode(true));
  [marksRow, colorRow, soundRow].forEach(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à for each.
    //
    // Paramètres :
    // - row : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `HTMLDivElement` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (row) => gamePanel.appendChild(row),
  );
  gamePanel.appendChild(document.createElement('div')).className = 'ms-menu__separator';
  gamePanel.appendChild(scoresRow);
  gamePanel.appendChild(document.createElement('div')).className = 'ms-menu__separator';
  gamePanel.appendChild(exitRow);

  // Constante `helpRow1` utilisée par la responsabilité de ce module.
  const helpRow1 = createRow(
    'Contents',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onOpenContentsHelp?.();
      setOpened(null);
    },
  );
  setRowContent(helpRow1, 'Contents', false, 'F1');
  // Constante `helpRow2` utilisée par la responsabilité de ce module.
  const helpRow2 = createRow(
    'Search for Help on...',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onSearchHelp?.();
      setOpened(null);
    },
  );
  // Constante `helpRow3` utilisée par la responsabilité de ce module.
  const helpRow3 = createRow(
    'Using Help',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onUsingHelp?.();
      setOpened(null);
    },
  );
  // Constante `helpSep1` utilisée par la responsabilité de ce module.
  const helpSep1 = document.createElement('div');
  helpSep1.className = 'ms-menu__separator';
  // Constante `helpRow4` utilisée par la responsabilité de ce module.
  const helpRow4 = createRow(
    'About Minesweeper...',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onAbout?.();
      setOpened(null);
    },
  );

  // Constante `helpLink` utilisée par la responsabilité de ce module.
  const helpLink = createRow(
    'GitHub',
    // ----------------------------------------------------------------------------
    // Crée ligne callback.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      actions.onGithub?.();
      setOpened(null);
    },
    false,
  );

  // ----------------------------------------------------------------------------
  // Synchronise état.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const syncState = (): void => {
    setRowContent(marksRow, 'Marks (?)', marksEnabled);
    setRowContent(colorRow, 'Color', colorEnabled);
    setRowContent(soundRow, 'Sound', soundEnabled);
  };

  // ----------------------------------------------------------------------------
  // Synchronise zoom état.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const syncZoomState = (): void => {
    setRowContent(zoom1Row, 'Zoom 1x', currentZoom === 1);
    setRowContent(zoom15Row, 'Zoom 1.5x', currentZoom === 1.5);
    setRowContent(zoom2Row, 'Zoom 2x', currentZoom === 2);
  };

  // ----------------------------------------------------------------------------
  // Définit disposition.
  //
  // Paramètres :
  // - layout : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const setLayout = (layout: BoardLayout): void => {
    // Constante `width` utilisée par la responsabilité de ce module.
    const width = Math.max(1, layout.topBar.width);
    // Constante `left` utilisée par la responsabilité de ce module.
    const left = Math.max(0, layout.topBar.x);
    // Constante `scale` utilisée par la responsabilité de ce module.
    const scale = Math.max(0.5, layout.cellSize / 16);
    // Constante `menuBarHeight` utilisée par la responsabilité de ce module.
    const menuBarHeight = Math.max(1, Math.round(20 * scale));

    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(0, layout.topBar.y)}px`;
    menu.style.width = `${width}px`;
    menu.style.setProperty('--ms-scale', `${scale}`);

    topBar.style.width = `${width}px`;
    topBar.style.height = `${menuBarHeight}px`;
    gamePanel.style.left = '0px';
    helpPanel.style.left = `${Math.max(0, Math.round(gameButton.offsetWidth))}px`;
    gamePanel.style.top = `${menuBarHeight}px`;
    helpPanel.style.top = `${menuBarHeight}px`;
  };

  helpPanel.appendChild(helpRow1);
  helpPanel.appendChild(helpRow2);
  helpPanel.appendChild(helpRow3);
  helpPanel.appendChild(helpSep1);
  helpPanel.appendChild(helpRow4);
  helpPanel.appendChild(helpLink);

  // ----------------------------------------------------------------------------
  // Bascule jeu.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const toggleGame = (): void => {
    setOpened(openedMenu === 'game' ? null : 'game');
  };
  // ----------------------------------------------------------------------------
  // Bascule help.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const toggleHelp = (): void => {
    setOpened(openedMenu === 'help' ? null : 'help');
  };

  gameButton.addEventListener(
    'click',
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à add event listener.
    //
    // Paramètres :
    // - event : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (event) => {
      event.stopPropagation();
      toggleGame();
    },
  );
  helpButton.addEventListener(
    'click',
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à add event listener.
    //
    // Paramètres :
    // - event : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (event) => {
      event.stopPropagation();
      toggleHelp();
    },
  );

  menu.addEventListener(
    'click',
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à add event listener.
    //
    // Paramètres :
    // - event : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (event) => {
      event.stopPropagation();
    },
  );

  // ----------------------------------------------------------------------------
  // Traite document pointer.
  //
  // Paramètres :
  // - event : valeur fournie au traitement.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const handleDocumentPointer = (event: Event): void => {
    if (!(event.target instanceof Node)) return;
    if (menu.contains(event.target)) return;
    setOpened(null);
  };

  document.addEventListener('pointerdown', handleDocumentPointer, { capture: true });

  topBar.appendChild(gameButton);
  topBar.appendChild(helpButton);
  menu.appendChild(topBar);
  menu.appendChild(gamePanel);
  menu.appendChild(helpPanel);
  root.appendChild(menu);

  // ----------------------------------------------------------------------------
  // Synchronise difficulté état.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const syncDifficultyState = (): void => {
    setRowContent(beginnerRow, formatDifficultyLabel('Beginner'), currentDifficulty === 'Beginner');
    setRowContent(intermediateRow, formatDifficultyLabel('Intermediate'), currentDifficulty === 'Intermediate');
    setRowContent(expertRow, formatDifficultyLabel('Expert'), currentDifficulty === 'Expert');
    syncState();
    syncZoomState();
  };

  syncDifficultyState();

  return {
    // ----------------------------------------------------------------------------
    // Définit difficulté.
    //
    // Paramètres :
    // - difficulty : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setDifficulty: (difficulty) => {
      currentDifficulty = difficulty;
      syncDifficultyState();
    },
    // ----------------------------------------------------------------------------
    // Définit marks enabled.
    //
    // Paramètres :
    // - enabled : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setMarksEnabled: (enabled) => {
      marksEnabled = enabled;
      actions.onToggleMarks?.(enabled);
      syncState();
    },
    // ----------------------------------------------------------------------------
    // Définit color enabled.
    //
    // Paramètres :
    // - enabled : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setColorEnabled: (enabled) => {
      colorEnabled = enabled;
      actions.onToggleColor?.(enabled);
      syncState();
    },
    // ----------------------------------------------------------------------------
    // Définit son enabled.
    //
    // Paramètres :
    // - enabled : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setSoundEnabled: (enabled) => {
      soundEnabled = enabled;
      actions.onToggleSound?.(enabled);
      syncState();
    },
    // ----------------------------------------------------------------------------
    // Définit zoom.
    //
    // Paramètres :
    // - zoom : valeur fournie au traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    setZoom: (zoom) => {
      currentZoom = zoom;
      syncZoomState();
    },
    setLayout,
    // ----------------------------------------------------------------------------
    // Libère le traitement demandé.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    dispose: () => {
      document.removeEventListener('pointerdown', handleDocumentPointer, true);
      menu.remove();
    },
  };
}
