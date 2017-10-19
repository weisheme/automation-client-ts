/**
 * Result of running an action, optionally on a target.
 * Instances may add further information beyond boolean success or failure.
 * Useful when promise chaining, to allow results to be included along with the target.
 */
export interface ActionResult<T = undefined> {

    /**
     * Target on which we ran the action, if there is one.
     */
    readonly target: T;

    /**
     * Whether or not the action succeeded.
     */
    readonly success: boolean;
}

/**
 * Convenient implementation of ActionResult
 */
export class SimpleActionResult<T> implements ActionResult<T> {

    constructor(public readonly target: T, public readonly success: boolean) {
    }
}

export function successOn<T>(t: T): ActionResult<T> {
    return new SimpleActionResult(t, true);
}