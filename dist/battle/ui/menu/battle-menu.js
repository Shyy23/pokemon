import Phaser from "../../../lib/phaser.js";
import { MONSTER_ASSET_KEYS, UI_ASSET_KEYS } from "../../../assets/asset-keys.js";
import { DIRECTION } from "../../../common/direction.js";
import { exhaustiveGuard } from "../../../utils/guard.js";
import { ACTIVE_BATTLE_MENU, ATTACK_MENU_OPTIONS, BATTLE_MENU_OPTIONS } from "./battle-menu-options.js";
import { BATTLE_UI_TEXT_STYLE } from "./battle-menu-config.js";


const BATTLE_MENU_POS = Object.freeze({
x: 42,
y: 38,
});
const ATTACK_MENU_POS = Object.freeze({
x: 42,
y: 38,
});

export class BattleMenu{
    /** @type {Phaser.Scene} */
    #scene;
    
    
    /** @type {Phaser.GameObjects.Container} */
    #mainBattleMenuPhaserContainerGameObject;
    /** @type {Phaser.GameObjects.Container} */
    #moveSelectionSubBattleMenuPhaserContainerGameObject;
    /** @type {Phaser.GameObjects.Text} */
    #battleTextGameObjectLine1;
    /** @type {Phaser.GameObjects.Text} */
    #battleTextGameObjectLine2;
    /** @type {Phaser.GameObjects.Image} */
    #mainBattleMenuCursorPhaserImageGameObject;
    /** @type {Phaser.GameObjects.Image} */
    #attackBattleMenuCursorPhaserImageGameObject;
    /** @type {import("./battle-menu-options.js").BattleMenuOptions} */
    #selectedBattleMenuOption;
    /** @type {import("./battle-menu-options.js").AttackMenuOptions} */
    #selectedAttackMenuOption;
    /** @type {import("./battle-menu-options.js").ActiveBattleMenu} */
    #activeBattleMenu;
    /** @type {string[]} */
    #queuedInfoPaneMessages;
    /** @type {() => void | undefined} */
    #queuedInfoPaneCallback;
    /** @type {boolean} */
    #waitingForPlayerInput;
    /** @type {number | undefined} */
    #selectedAttackIndex;

    /**
     * 
     * @param {Phaser.Scene} scene Phaser 3 battle menu add
     */
    constructor(scene){
        this.#scene = scene;
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_1;
        this.#queuedInfoPaneCallback = undefined;
        this.#queuedInfoPaneMessages = [];
        this.#waitingForPlayerInput = false;
        this.#selectedAttackIndex = undefined;
        this.#createMainInfoPane();
        this.#createMainBattleMenu();
        this.#createMonsterAttackSubMenu();
    }
    
    /** @type {number | undefined} */
    get selectedAttack(){
        if(this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT){
            return this.#selectedAttackIndex;
        }
        return undefined;
    }

    showMainBattleMenu(){
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
        this.#battleTextGameObjectLine1.setText('what should');
        this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1);
        this.#battleTextGameObjectLine1.setAlpha(1);
        this.#battleTextGameObjectLine2.setAlpha(1);

        // this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
        // this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(BATTLE_MENU_POS.x, BATTLE_MENU_POS.y);
        this.#selectedAttackIndex = undefined;
    }
    hideMainBattleMenu(){
        this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0);
        this.#battleTextGameObjectLine1.setAlpha(0);
        this.#battleTextGameObjectLine2.setAlpha(0);
    }
    showMonsterAttackSubMenu(){
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
        this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(1);
    }
    hideMonsterAttackSubMenu(){
        this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0);
    }

    /**
     * 
     * @param { import('../../../common/direction.js').Direction | 'OK' | 'CANCEL'} input 
     */
    
    handlePlayerInput(input){
        if(this.#waitingForPlayerInput && (input === 'CANCEL' || input === 'OK')){
            this.#updateInfoPaneWithMessage();
            return;
        }
        
        if(input === 'CANCEL'){
            this.#switchToMainBattleMenu();
            return;
        }
        
        if(input === 'OK'){
            if(this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN){
                this.#handlePlayerInputChooseMainBattleOption();
                return;

            }
            if(this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT){
                // TODO:
                this.#handlePlayerChooseAttack();
                return;
            }
            this.hideMainBattleMenu();
            this.showMonsterAttackSubMenu();
            return;
        }

        this.#updateSelectedBattleMenuOptionFromInput(input);
        this.#moveMainBattleMenuCursor();
        this.#updateSelectedAttackMenuOptionFromInput(input);
        this.#moveAttackBattleMenuCursor();
    }

    /**
     * @param {string[]} message 
     * @param {() => void} [callback] 
     */
    updateInfoPaneMessagesAndWaitingForInput(message, callback){
        this.#queuedInfoPaneMessages = message;
        this.#queuedInfoPaneCallback = callback;

        this.#updateInfoPaneWithMessage();
    }
    
    #updateInfoPaneWithMessage(){
        this.#waitingForPlayerInput = false;
        this.#battleTextGameObjectLine1.setText('').setAlpha(1);

        // Check If all messages have been displayed from the queue and call the callback
        if(this.#queuedInfoPaneMessages.length === 0){
            if(this.#queuedInfoPaneCallback){
                this.#queuedInfoPaneCallback();
                this.#queuedInfoPaneCallback = undefined;
            }
            return;
        }

        const messageToDisplay = this.#queuedInfoPaneMessages.shift();
        this.#battleTextGameObjectLine1.setText(messageToDisplay);
        this.#waitingForPlayerInput = true;
    }
    #createMainBattleMenu(){
        this.#battleTextGameObjectLine1 = this.#scene.add.text(20, 468, 'What Should', BATTLE_UI_TEXT_STYLE);


        // TODO: update to use monster datayang melewati instance kelas 
        this.#battleTextGameObjectLine2 = this.#scene.add.text(20, 512, `${MONSTER_ASSET_KEYS.JIVY} do next?`, BATTLE_UI_TEXT_STYLE);

        this.#mainBattleMenuCursorPhaserImageGameObject = this.#scene.add.image( BATTLE_MENU_POS.x, BATTLE_MENU_POS.y ,UI_ASSET_KEYS.CURSOR, 0).setOrigin(0.5).setScale(2);

        this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(520, 448, [
            this.#createMainInfoSubPane(),
            this.#scene.add.text(55, 20, BATTLE_MENU_OPTIONS.FIGHT, BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(240, 20, BATTLE_MENU_OPTIONS.SWITCH, BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(55, 70, BATTLE_MENU_OPTIONS.ITEM, BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(240, 70, BATTLE_MENU_OPTIONS.FLEE, BATTLE_UI_TEXT_STYLE),
            this.#mainBattleMenuCursorPhaserImageGameObject,
        ]);

        this.hideMainBattleMenu();
    }
    #createMonsterAttackSubMenu(){
        this.#attackBattleMenuCursorPhaserImageGameObject = this.#scene.add.image(ATTACK_MENU_POS.x, ATTACK_MENU_POS.y, UI_ASSET_KEYS.CURSOR, 0).setOrigin(.5).setScale(2);
        this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(0, 448, [
            this.#scene.add.text(55, 20, 'slash', BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(240, 20, 'growl', BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(55, 70, 'run', BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(240, 70, '...', BATTLE_UI_TEXT_STYLE),
            this.#attackBattleMenuCursorPhaserImageGameObject,
        ]);

        this.hideMonsterAttackSubMenu();
    }

    #createMainInfoPane(){
        const rectHeight = 124;
        const padding = 4;
        this.#scene.add.rectangle(
            padding, 
            this.#scene.scale.height - rectHeight - padding,
            this.#scene.scale.width - padding * 2,
            rectHeight,
            0xede4f3,
            1)
            .setOrigin(0)
            .setStrokeStyle(8, 0xe4434a, 1);
    }
    #createMainInfoSubPane(){
        const rectWidth = 500;
        const rectHeight = 124;
        return this.#scene.add.rectangle(
            0, 
            0,
            rectWidth,
            rectHeight,
            0xede4f3,
            1)
            .setOrigin(0)
            .setStrokeStyle(8, 0x905ac2, 1);
        }

        /**
        * @param { import('../../../common/direction.js').Direction } direction 
        */

        #updateSelectedBattleMenuOptionFromInput(direction){
            if(this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN){
                return;
            }

            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT){
                switch(direction){
                    case DIRECTION.RIGHT:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
                        return;
                    case DIRECTION.DOWN:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
                        return;
                    case DIRECTION.LEFT:
                    case DIRECTION.UP:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM){
                switch(direction){
                    case DIRECTION.RIGHT:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
                        return;
                    case DIRECTION.UP:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
                        return;
                    case DIRECTION.LEFT:
                    case DIRECTION.DOWN:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH){
                switch(direction){
                    case DIRECTION.LEFT:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
                        return;
                    case DIRECTION.DOWN:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
                        return;
                    case DIRECTION.RIGHT:
                    case DIRECTION.UP:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE){
                switch(direction){
                    case DIRECTION.LEFT:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
                        return;
                    case DIRECTION.UP:
                        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
                        return;
                    case DIRECTION.RIGHT:
                    case DIRECTION.DOWN:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }

            exhaustiveGuard(this.#selectedBattleMenuOption);
        }

        #moveMainBattleMenuCursor(){
            if(this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN){
                return;
            }
            switch (this.#selectedBattleMenuOption) {
                case BATTLE_MENU_OPTIONS.FIGHT:
                    this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(BATTLE_MENU_POS.x, BATTLE_MENU_POS.y);
                    return;
                case BATTLE_MENU_OPTIONS.SWITCH:
                    this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, BATTLE_MENU_POS.y);
                    return;
                case BATTLE_MENU_OPTIONS.ITEM:
                    this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(BATTLE_MENU_POS.x, 86);
                    return;
                case BATTLE_MENU_OPTIONS.FLEE:
                    this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
                    return;
                default:
                    exhaustiveGuard(this.#selectedBattleMenuOption);
            }
        }

        /**
        * @param { import('../../../common/direction.js').Direction } direction 
        */  
        #updateSelectedAttackMenuOptionFromInput(direction){
            if(this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT){
                return;
            }
            if(this.#selectedAttackMenuOption === ATTACK_MENU_OPTIONS.SKILL_1){
                switch(direction){
                    case DIRECTION.RIGHT:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_2;
                        return;
                    case DIRECTION.DOWN:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_3;
                        return;
                    case DIRECTION.LEFT:
                    case DIRECTION.UP:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            if(this.#selectedAttackMenuOption === ATTACK_MENU_OPTIONS.SKILL_3){
                switch(direction){
                    case DIRECTION.RIGHT:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_4;
                        return;
                    case DIRECTION.UP:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_1;
                        return;
                    case DIRECTION.LEFT:
                    case DIRECTION.DOWN:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            if(this.#selectedAttackMenuOption === ATTACK_MENU_OPTIONS.SKILL_2){
                switch(direction){
                    case DIRECTION.LEFT:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_1;
                        return;
                    case DIRECTION.DOWN:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_4;
                        return;
                    case DIRECTION.RIGHT:
                    case DIRECTION.UP:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            if(this.#selectedAttackMenuOption === ATTACK_MENU_OPTIONS.SKILL_4){
                switch(direction){
                    case DIRECTION.LEFT:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_3;
                        return;
                    case DIRECTION.UP:
                        this.#selectedAttackMenuOption = ATTACK_MENU_OPTIONS.SKILL_2;
                        return;
                    case DIRECTION.RIGHT:
                    case DIRECTION.DOWN:
                    case DIRECTION.NONE:
                        return;
                    default:
                        exhaustiveGuard(direction);
                }
                return;
            }
            exhaustiveGuard(this.#selectedAttackMenuOption);
        }

        #moveAttackBattleMenuCursor(){
            if(this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT){
                return;
            }
            switch (this.#selectedAttackMenuOption) {
                case ATTACK_MENU_OPTIONS.SKILL_1:
                    this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(ATTACK_MENU_POS.x, ATTACK_MENU_POS.y);
                    return;
                case ATTACK_MENU_OPTIONS.SKILL_2:
                    this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(228, ATTACK_MENU_POS.y);
                    return;
                case ATTACK_MENU_OPTIONS.SKILL_3:
                    this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(ATTACK_MENU_POS.x, 86);
                    return;
                case ATTACK_MENU_OPTIONS.SKILL_4:
                    this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
                    return;
                default:
                    exhaustiveGuard(this.#selectedAttackMenuOption);
            }
        }

        #switchToMainBattleMenu(){
            this.hideMonsterAttackSubMenu();
            this.showMainBattleMenu();
        }

        #handlePlayerInputChooseMainBattleOption(){
            this.hideMainBattleMenu();
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT){
                
                this.showMonsterAttackSubMenu();
                return;
            }
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM){
                  // TODO:
                  this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_ITEM;
                this.updateInfoPaneMessagesAndWaitingForInput(['Your Bag is Empty...'], () => {
                    this.#switchToMainBattleMenu();
                });
                return;
            }
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH){
                // TODO:
                this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_SWITCH;
                this.updateInfoPaneMessagesAndWaitingForInput(['You have no other monster in your party...'], () => {
                    this.#switchToMainBattleMenu();
                });
                return;
            }
            if(this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE){
                // TODO:
                this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_FLEE;
                this.updateInfoPaneMessagesAndWaitingForInput(['Your Fail to Run away...'], () => {
                    this.#switchToMainBattleMenu();
                });
                return;
            }

        exhaustiveGuard(this.#selectedBattleMenuOption);
            }

        #handlePlayerChooseAttack(){
            let selectedMoveIndex = 0;
            switch(this.#selectedAttackMenuOption){
                case ATTACK_MENU_OPTIONS.SKILL_1:
                    selectedMoveIndex = 0;
                    break;
                case ATTACK_MENU_OPTIONS.SKILL_2:
                    selectedMoveIndex = 1;
                    break;
                case ATTACK_MENU_OPTIONS.SKILL_3:
                    selectedMoveIndex = 2;
                    break;
                case ATTACK_MENU_OPTIONS.SKILL_4:
                    selectedMoveIndex = 3;
                    break;
                default:
                    exhaustiveGuard(this.#selectedAttackMenuOption);
            }

            this.#selectedAttackIndex = selectedMoveIndex;

        }
}