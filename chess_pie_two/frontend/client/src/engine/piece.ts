import { Square, MoveRule } from './types';
import { toCoords, toSquare } from './utils';
import type { BoardClass } from './board';

export abstract class Piece {
    id: string;
    type: string;
    name: string;
    color: "white" | "black";
    position: Square;
    hasMoved: boolean = false;

    constructor(id: string, type: string, color: "white" | "black", position: Square, name?: string) {
        this.id = id;
        this.type = type;
        this.color = color;
        this.position = position;
        this.name = name || type;
    }

    abstract isValidMove(from: Square, to: Square, board: BoardClass): boolean;
    abstract canAttack(target: Square, board: BoardClass): boolean;
    abstract clone(): Piece;

    static create(id: string, type: string, color: "white" | "black", position: Square, rules: any = [], logic: any = [], name?: string): Piece {
        const actualRules = typeof rules === 'string' ? JSON.parse(rules) : (Array.isArray(rules) ? rules : []);
        const actualLogic = typeof logic === 'string' ? JSON.parse(logic) : (Array.isArray(logic) ? logic : []);

        if (actualRules.length > 0 || actualLogic.length > 0) {
            return new CustomPiece(id, type, color, position, actualRules, actualLogic, name);
        }

        const lowerType = type.toLowerCase();
        let piece: Piece;
        switch (lowerType) {
            case 'pawn': piece = new Pawn(id, color, position); break;
            case 'knight': piece = new Knight(id, color, position); break;
            case 'bishop': piece = new Bishop(id, color, position); break;
            case 'rook': piece = new Rook(id, color, position); break;
            case 'queen': piece = new Queen(id, color, position); break;
            case 'king': piece = new King(id, color, position); break;
            default: piece = new CustomPiece(id, type, color, position, actualRules, actualLogic, name); break;
        }
        if (name) piece.name = name;
        return piece;
    }

    static createStandard(id: string, type: string, color: "white" | "black", position: Square): Piece | null {
        const lowerType = type.toLowerCase();
        switch (lowerType) {
            case 'pawn': return new Pawn(id, color, position);
            case 'knight': return new Knight(id, color, position);
            case 'bishop': return new Bishop(id, color, position);
            case 'rook': return new Rook(id, color, position);
            case 'queen': return new Queen(id, color, position);
            case 'king': return new King(id, color, position);
            default: return null;
        }
    }
}

export class CustomPiece extends Piece {
    rules: MoveRule[];
    logic: any[];
    variables: Record<string, number> = {};
    public isCustom = true;

    constructor(id: string, type: string, color: "white" | "black", position: Square, rules: any = [], logic: any = [], name?: string) {
        super(id, type, color, position, name);
        this.rules = typeof rules === 'string' ? JSON.parse(rules) : (Array.isArray(rules) ? rules : []);
        this.logic = typeof logic === 'string' ? JSON.parse(logic) : (Array.isArray(logic) ? logic : []);
    }

    // Execution Queue for preventing infinite loops
    private pendingTriggers: Array<{ type: string, context: any }> = [];
    private isExecutingLogic: boolean = false;

    // Helper method to check if a variable name is a position preset
    private isPositionVariable(varName: string): boolean {
        return /^[A-H][1-8]$/.test(varName.toUpperCase());
    }

    // Helper method to check if current position matches a position variable
    private isAtPosition(positionVar: string): boolean {
        const normalized = positionVar.toUpperCase();
        if (!this.isPositionVariable(normalized)) return false;
        return this.position.toUpperCase() === normalized;
    }

    executeLogic(triggerType: string, context: any, board: BoardClass) {
        if (!this.logic || !Array.isArray(this.logic)) return;

        // Queue trigger if already executing
        if (this.isExecutingLogic) {
            this.pendingTriggers.push({ type: triggerType, context });
            return;
        }

        this.isExecutingLogic = true;
        this._executeLogicInternal(triggerType, context, board);
        
        // Process pending triggers (max 20 iterations to prevent infinite loops)
        let iterations = 0;
        const MAX_ITERATIONS = 20;
        
        while (this.pendingTriggers.length > 0 && iterations < MAX_ITERATIONS) {
            const pending = this.pendingTriggers.shift()!;
            this._executeLogicInternal(pending.type, pending.context, board);
            iterations++;
        }
        
        if (this.pendingTriggers.length > 0) {
            console.warn(`[Logic] Infinite loop risk detected for piece ${this.id}, stopping execution after ${MAX_ITERATIONS} recursive triggers.`);
            this.pendingTriggers = [];
        }
        
        this.isExecutingLogic = false;
    }

    private _executeLogicInternal(triggerType: string, context: any, board: BoardClass) {
        if (!this.logic) return;

        // Find relevant triggers
        const triggers = this.logic.filter((b: any) => b.type === 'trigger' && b.id === triggerType);
        
        if (triggers.length > 0) {
            console.log(`[Logic] Executing "${triggerType}" for ${this.id} (${this.type}). Found ${triggers.length} matching blocks.`);
        }

        for (const trigger of triggers) {
            let conditionsMet = true;
            const vals = trigger.socketValues || {};

            // Helper for matching piece types robustly (handles ID suffixes and case)
            const matchesType = (p: Piece | null, expected: string) => {
                if (!expected || expected === 'Any') return true;
                if (!p) return false;
                const pType = p.type.toLowerCase();
                const pName = p.name.toLowerCase();
                const exp = expected.toLowerCase();
                
                const isMatch = pType === exp || pType.startsWith(exp + '_') ||
                              pName === exp || pName.startsWith(exp + '_');
                
                if (!isMatch) {
                    console.log(`[Logic] Type mismatch: [Expected: ${expected}] vs [Captured: type=${p.type}, name=${p.name}]`);
                }
                
                return isMatch;
            };

            if (triggerType === 'on-capture') {
                if (vals.by && !matchesType(context.capturedPiece, vals.by)) {
                    console.log(`[Logic] Condition failed for "on-capture": Expected ${vals.by}, but captured ${context.capturedPiece?.type}`);
                    conditionsMet = false;
                }
            } else if (triggerType === 'on-captured') {
                if (vals.by && !matchesType(context.attacker, vals.by)) {
                    console.log(`[Logic] Condition failed for "on-captured": Expected attacker ${vals.by}, but attacked by ${context.attacker?.type}`);
                    conditionsMet = false;
                }
            } else if (triggerType === 'on-threat') {
                if (vals.by && !matchesType(context.attacker, vals.by)) {
                    console.log(`[Logic] Condition failed for "on-threat": Expected attacker ${vals.by}, but attacked by ${context.attacker?.type}`);
                    conditionsMet = false;
                }
            } else if (triggerType === 'on-environment') {
                const [col, row] = toCoords(this.position);
                const isWhiteSquare = (col + row) % 2 === 0;
                
                if (vals.condition === 'White Square' && !isWhiteSquare) {
                    console.log(`[Logic] Condition failed for "on-environment": Not on White Square`);
                    conditionsMet = false;
                }
                if (vals.condition === 'Black Square' && isWhiteSquare) {
                    console.log(`[Logic] Condition failed for "on-environment": Not on Black Square`);
                    conditionsMet = false;
                }
                if (vals.condition === 'Is Attacked' && !context.isAttacked) {
                    console.log(`[Logic] Condition failed for "on-environment": Piece is not attacked`);
                    conditionsMet = false;
                }
            } else if (triggerType === 'on-var') {
                if (vals.varName) {
                    const current = this.variables[vals.varName] || 0;
                    const v = Number(vals.value);
                    let met = true;
                    switch (vals.op) {
                        case '==': if (current !== v) met = false; break;
                        case '!=': if (current === v) met = false; break;
                        case '>': if (current <= v) met = false; break;
                        case '<': if (current >= v) met = false; break;
                        case '>=': if (current < v) met = false; break;
                        case '<=': if (current > v) met = false; break;
                    }
                    if (!met) {
                        console.log(`[Logic] Condition failed for "on-var": ${vals.varName} (${current}) ${vals.op} ${v} is false`);
                        conditionsMet = met;
                    }
                }
            } else if (triggerType === 'variable-trigger') {
                if (vals.variableName && vals.value !== undefined) {
                    let current: any;
                    let met = true;
                    
                    // Check if this is a position variable
                    if (this.isPositionVariable(vals.variableName)) {
                        current = this.isAtPosition(vals.variableName) ? 1 : 0;
                    } else {
                        current = this.variables[vals.variableName];
                    }
                    
                    const comparisonType = vals.comparisonType || 'Number';
                    
                    switch (comparisonType) {
                        case 'Number':
                            const currentNum = Number(current) || 0;
                            const targetNum = Number(vals.value);
                            if (currentNum !== targetNum) met = false;
                            break;
                        case 'Text':
                            const currentText = String(current || '');
                            const targetText = String(vals.value);
                            if (currentText !== targetText) met = false;
                            break;
                        case 'Boolean':
                            const currentBool = Boolean(current);
                            const targetBool = vals.value.toLowerCase() === 'true' || vals.value === '1';
                            if (currentBool !== targetBool) met = false;
                            break;
                    }
                    
                    if (!met) {
                        console.log(`[Logic] Condition failed for "variable-trigger": ${vals.variableName} (${current}) != ${vals.value} (${comparisonType})`);
                        conditionsMet = met;
                    }
                }
            }

            if (conditionsMet) {
                if (trigger.childId) {
                    console.log(`[Logic] Conditions met for ${trigger.id} (instance ${trigger.instanceId}). Executing child ${trigger.childId}`);
                    this.runBlock(trigger.childId, context, board);
                } else {
                    console.log(`[Logic] Conditions met for ${trigger.id}, but NO action (childId) is connected.`);
                }
            }
        }
    }

    private runBlock(blockId: string, context: any, board: BoardClass) {
        const block = this.logic.find((b: any) => b.instanceId === blockId);
        if (!block) return;

        const vals = block.socketValues || {};

        switch (block.id) {
            case 'kill':
                // Determine target based on socket value
                if (vals.target === 'Attacker' && context.attacker) {
                    board.setPiece(context.attacker.position, null);
                } else {
                    // Default: kill the piece this logic belongs to (this piece)
                    board.setPiece(this.position, null);
                }
                break;
            case 'transformation':
                if (vals.target) {
                    const newPiece = Piece.create(this.id, vals.target, this.color, this.position);
                    newPiece.hasMoved = this.hasMoved;
                    board.setPiece(this.position, newPiece);
                }
                break;
            case 'modify-var':
                if (vals.varName && vals.op && vals.value !== undefined) {
                    const current = this.variables[vals.varName] || 0;
                    let next = current;
                    const v = Number(vals.value);
                    if (vals.op === '+=') next += v;
                    else if (vals.op === '-=') next -= v;
                    else if (vals.op === '=') next = v;
                    this.variables[vals.varName] = next;
                    
                    // Trigger on-var check after modification
                    this.executeLogic('on-var', { varName: vals.varName, value: next }, board);
                }
                break;
            case 'cooldown':
                if (vals.duration) {
                    this.variables['cooldown'] = Number(vals.duration);
                }
                break;
            case 'charge':
                if (vals.turns) {
                    this.variables['charge'] = Number(vals.turns);
                }
                break;
            case 'mode':
                if (vals.mode) {
                    this.variables['mode'] = vals.mode === 'On' ? 1 : 0;
                }
                break;
            case 'prevent':
                if (context.prevented !== undefined) context.prevented = true;
                // Generic prevent also sets specific flags if they exist
                if (context.movePrevented !== undefined) context.movePrevented = true;
                if (context.capturePrevented !== undefined) context.capturePrevented = true;
                break;
            case 'prevent-move':
                if (context.movePrevented !== undefined) context.movePrevented = true;
                break;
            case 'prevent-capture':
                if (context.capturePrevented !== undefined) context.capturePrevented = true;
                break;
            case 'affect-adjacent':
                const [col, row] = toCoords(this.position);
                const adjacentSquares = [
                    [col-1, row], [col+1, row], [col, row-1], [col, row+1],
                    [col-1, row-1], [col-1, row+1], [col+1, row-1], [col+1, row+1]
                ];
                
                for (const [c, r] of adjacentSquares) {
                    const sq = toSquare([c, r]);
                    const targetPiece = board.getPiece(sq);
                    if (targetPiece && targetPiece instanceof CustomPiece) {
                        // Apply specific effects to target
                        if (vals.effect === 'cooldown' && vals.value) {
                             targetPiece.variables['cooldown'] = Number(vals.value);
                        } else if (vals.effect === 'charge' && vals.value) {
                             targetPiece.variables['charge'] = Number(vals.value);
                        } else if (vals.effect === 'modify-var' && vals.varName && vals.value) {
                             targetPiece.variables[vals.varName] = Number(vals.value);
                        }
                    }
                }
                break;
        }

        if (block.childId) {
            this.runBlock(block.childId, context, board);
        }
    }

    updateTurnState(board: BoardClass) {
        // Cooldown processing
        if (this.variables['cooldown'] && this.variables['cooldown'] > 0) {
            this.variables['cooldown']--;
            
            // Trigger on-cooldown-tick
            this.executeLogic('on-cooldown-tick', { remaining: this.variables['cooldown'] }, board);
            
            // Trigger on-cooldown-end when it reaches 0
            if (this.variables['cooldown'] === 0) {
                this.executeLogic('on-cooldown-end', {}, board);
            }
        }
        
        // Charge processing
        if (this.variables['charge'] && this.variables['charge'] > 0) {
            this.variables['charge']--;
            
            // Trigger on-charge-tick
            this.executeLogic('on-charge-tick', { remaining: this.variables['charge'] }, board);
            
            if (this.variables['charge'] === 0) {
                this.executeLogic('on-charge-complete', {}, board);
            }
        }

        // Fire on-turn-start trigger for general logic
        this.executeLogic('on-turn-start', {}, board);

        // Environment checks
        const [col, row] = toCoords(this.position);
        const isWhiteSquare = (col + row) % 2 === 0;
        this.executeLogic('on-environment', { 
            isWhiteSquare, 
            isBlackSquare: !isWhiteSquare,
            isAttacked: false // Will be updated by checkThreats later
        }, board); 
        
        // General variable check trigger
        this.executeLogic('on-var', {}, board);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        // Cooldown check: if > 0, the piece cannot move.
        if (this.variables['cooldown'] && this.variables['cooldown'] > 0) {
            return false;
        }

        if (this.rules.length === 0) {
            // Fallback to standard piece behavior if no custom rules defined
            const standardPiece = Piece.createStandard(this.id, this.type, this.color, from);
            if (standardPiece) {
                return standardPiece.isValidMove(from, to, board);
            }
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        
        // Horizontal/Vertical steps
        const dx = toCoordsCoords[0] - fromCoords[0];
        const dy = toCoordsCoords[1] - fromCoords[1];

        // Horizontal/Vertical distance (absolute)
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        // Directions from white's perspective are different for black
        // However, ΔY in our visual editor usually means "forward" for the color.
        // Let's adjust dy based on color so that positive is always "forward"
        let forwardDy = dy;
        if (board.gridType === 'hex') {
            // In hex pointy-top, white moving up is r decreasing.
            // So if dy (dr) is negative, it's forward for white.
            forwardDy = this.color === 'white' ? -dy : dy;
        } else {
            forwardDy = this.color === 'white' ? dy : -dy;
        }

        let isAllowed = false;

        for (const rule of this.rules) {
            let ruleResult = true; // For AND logic
            let currentLogic: 'AND' | 'OR' = 'AND';

            for (let i = 0; i < rule.conditions.length; i++) {
                const cond = rule.conditions[i];
                let value = 0;
                
                // Helper to check standard spatial conditions
                if (cond.variable === 'diffX') value = dx;
                else if (cond.variable === 'diffY') value = forwardDy;
                else if (cond.variable === 'absDiffX') value = adx;
                else if (cond.variable === 'absDiffY') value = ady;
                // Hex specific / generic distance
                else if (cond.variable === 'dist') {
                    if (board.gridType === 'hex') {
                        value = (Math.abs(dx) + Math.abs(dy) + Math.abs(-dx - dy)) / 2;
                    } else {
                        value = Math.max(adx, ady); // Chebyshev distance for square
                    }
                }
                // NEW: Check state variable conditions
                else if (cond.variable === 'cooldown') value = this.variables['cooldown'] || 0;
                else if (cond.variable === 'charge') value = this.variables['charge'] || 0;
                else if (cond.variable === 'mode') value = this.variables['mode'] || 0;


                let condSatisfied = false;
                switch (cond.operator) {
                    case '===': condSatisfied = value === cond.value; break;
                    case '>': condSatisfied = value > cond.value; break;
                    case '<': condSatisfied = value < cond.value; break;
                    case '>=': condSatisfied = value >= cond.value; break;
                    case '<=': condSatisfied = value <= cond.value; break;
                }

                if (i === 0) {
                    ruleResult = condSatisfied;
                } else {
                    if (currentLogic === 'AND') {
                        ruleResult = ruleResult && condSatisfied;
                    } else {
                        ruleResult = ruleResult || condSatisfied;
                    }
                }
                
                // Prepare logic for NEXT condition
                currentLogic = cond.logic || 'AND';
            }

            if (ruleResult) {
                // If a rule is met, it dictates the result
                if (rule.result === 'allow') {
                    isAllowed = true;
                } else {
                    // If an illegal rule is met, we return false immediately (illegal rules override legal ones)
                    return false;
                }
            }
        }

        return isAllowed;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        // For now, custom pieces attack using their normal move rules
        // In the future, we might add separate attack rules
        return this.isValidMove(this.position, target, board);
    }

    clone(): CustomPiece {
        const p = new CustomPiece(this.id, this.type, this.color, this.position, this.rules, this.logic);
        p.hasMoved = this.hasMoved;
        p.variables = { ...this.variables };
        return p;
    }
}

export class Pawn extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'pawn', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;

            // Forward direction depends on color
            const forward = this.color === 'white' ? { dq: 0, dr: -1 } : { dq: 0, dr: 1 };
            const captures = this.color === 'white' ? 
                [{ dq: -1, dr: 0 }, { dq: 1, dr: -1 }] : 
                [{ dq: 1, dr: 0 }, { dq: -1, dr: 1 }];

            // Standard one-square move
            if (dq === forward.dq && dr === forward.dr) {
                return board.getPiece(to) === null;
            }

            // Capture
            if (captures.some(c => c.dq === dq && c.dr === dr)) {
                const destinationPiece = board.getPiece(to);
                return destinationPiece !== null && destinationPiece.color !== this.color;
            }

            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];

        const direction = this.color === 'white' ? 1 : -1;
        const startingRank = this.color === 'white' ? 1 : board.height - 2;

        if (diffX === 0 && diffY === direction) {
            return board.getPiece(to) === null;
        }

        if (diffX === 0 && fromCoords[1] === startingRank && diffY === 2 * direction) {
            const pathClear = board.getPiece(toSquare([fromCoords[0], fromCoords[1] + direction])) === null;
            return pathClear && board.getPiece(to) === null;
        }

        if (diffX === 1 && diffY === direction) {
            const destinationPiece = board.getPiece(to);
            return destinationPiece !== null && destinationPiece.color !== this.color;
        }

        return false;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(this.position);
            const [tq, tr] = toCoords(target);
            const dq = tq - fq;
            const dr = tr - fr;

            const captures = this.color === 'white' ? 
                [{ dq: -1, dr: 0 }, { dq: 1, dr: -1 }] : 
                [{ dq: 1, dr: 0 }, { dq: -1, dr: 1 }];

            return captures.some(c => c.dq === dq && c.dr === dr);
        }

        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];
        const direction = this.color === 'white' ? 1 : -1;
        return diffX === 1 && diffY === direction;
    }

    clone(): Pawn {
        const p = new Pawn(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Knight extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'knight', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            const ds = -dq - dr;

            // Knight move is (dq, dr, ds) = permutation of (+-2, +-1, -+3) or similar
            // 12 possible jumps
            const absQ = Math.abs(dq);
            const absR = Math.abs(dr);
            const absS = Math.abs(ds);
            
            const isKnightJump = (absQ === 2 && absR === 1) || (absQ === 1 && absR === 2) ||
                                (absQ === 3 && absR === 1) || (absQ === 1 && absR === 3) ||
                                (absQ === 3 && absR === 2) || (absQ === 2 && absR === 3);
            
            if (!isKnightJump) return false;

            const destinationPiece = board.getPiece(to);
            return destinationPiece === null || destinationPiece.color !== this.color;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return (diffX === 2 && diffY === 1) || (diffX === 1 && diffY === 2);
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): Knight {
        const p = new Knight(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Bishop extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'bishop', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            if (!(dq === dr || dq === -2 * dr || 2 * dq === -dr)) return false;
            const destinationPiece = board.getPiece(to);
            if (destinationPiece !== null && destinationPiece.color === this.color) return false;
            const dist = Math.abs(dq === dr ? dq : (dq === -2*dr ? dr : dq/2));
            const sqDir = { q: dq / dist, r: dr / dist };
            for (let i = 1; i < dist; i++) {
                const sq = `${fq + i * sqDir.q},${fr + i * sqDir.r}` as Square;
                if (board.getPiece(sq) !== null || !board.isActive(sq)) return false;
            }
            return true;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);
        if (diffX !== diffY) return false;
        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) return false;
        const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
        const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
        for (let i = 1; i < diffX; i++) {
            const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection]);
            if (board.getPiece(square) !== null || !board.isActive(square)) return false;
        }
        return true;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): Bishop {
        const p = new Bishop(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Rook extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'rook', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            if (!(dq === 0 || dr === 0 || dq === -dr)) return false;
            const destinationPiece = board.getPiece(to);
            if (destinationPiece !== null && destinationPiece.color === this.color) return false;
            const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
            const sqDir = { q: dq / dist, r: dr / dist };
            for (let i = 1; i < dist; i++) {
                const sq = `${fq + i * sqDir.q},${fr + i * sqDir.r}` as Square;
                if (board.getPiece(sq) !== null || !board.isActive(sq)) return false;
            }
            return true;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);
        if (diffX !== 0 && diffY !== 0) return false;
        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) return false;
        if (diffX === 0) {
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffY; i++) {
                const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection]);
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
        } else {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]]);
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
        }
        return true;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): Rook {
        const p = new Rook(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}


export class Queen extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'queen', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            return this.canAttack(to, board) && (board.getPiece(to) === null || board.getPiece(to)?.color !== this.color);
        }
        // A queen's move is valid if it's a valid rook or bishop move
        return this.canAttack(to, board) && (board.getPiece(to) === null || board.getPiece(to)?.color !== this.color);
    }

    canAttack(target: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            // Queen = Rook + Bishop
            const [fq, fr] = toCoords(this.position);
            const [tq, tr] = toCoords(target);
            const dq = tq - fq;
            const dr = tr - fr;

            const isRookMove = (dq === 0 || dr === 0 || dq === -dr);
            const isBishopMove = (dq === dr || dq === -2 * dr || 2 * dq === -dr);
            
            if (!isRookMove && !isBishopMove) return false;

            // Obstruction check
            let dist: number;
            let sqDir: { q: number, r: number };
            
            if (isRookMove) {
                dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
                sqDir = { q: dq / dist, r: dr / dist };
            } else {
                dist = Math.abs(dq === dr ? dq : (dq === -2*dr ? dr : dq/2));
                sqDir = { q: dq / dist, r: dr / dist };
            }

            for (let i = 1; i < dist; i++) {
                const sq = `${fq + i * sqDir.q},${fr + i * sqDir.r}` as Square;
                if (board.getPiece(sq) !== null || !board.isActive(sq)) return false;
            }
            return true;
        }

        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        // Rook-like check
        if (diffX === 0 || diffY === 0) {
            if (diffX === 0) {
                const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
                for (let i = 1; i < diffY; i++) {
                    const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection]);
                    if (board.getPiece(square) !== null || !board.isActive(square)) return false;
                }
            } else {
                const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
                for (let i = 1; i < diffX; i++) {
                    const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]]);
                    if (board.getPiece(square) !== null || !board.isActive(square)) return false;
                }
            }
            return true;
        }

        // Bishop-like check
        if (diffX === diffY) {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection]);
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
            return true;
        }

        return false;
    }

    clone(): Queen {
        const p = new Queen(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class King extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'king', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr)) / 2;
            
            if (dist === 1) return true;
            if (dist === 2 && (dq === dr || dq === -2 * dr || 2 * dq === -dr)) return true;
            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return diffX <= 1 && diffY <= 1;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): King {
        const p = new King(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}
