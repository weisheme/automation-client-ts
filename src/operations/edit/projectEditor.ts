import { ActionResult } from "../../action/ActionResult";
import { HandlerContext } from "../../HandlerContext";
import { isProject, Project } from "../../project/Project";

/**
 * Modifies the given project, returning information about the modification.
 * @param p project to edit
 * @param context context for the current command or event handler
 * @param params params, if available
 */
export type ProjectEditor<P = any, ER extends EditResult = EditResult> =
    (p: Project, context?: HandlerContext, params?: P) => Promise<ER>;

export type SimpleProjectEditor<P = any> =
    (p: Project, context?: HandlerContext, params?: P) => Promise<Project>;

export type AnyProjectEditor<P = any> = ProjectEditor<P> | SimpleProjectEditor<P>;

/**
 * Result of editing a project. More information may be added by instances.
 */
export interface EditResult<P extends Project = Project> extends ActionResult<P> {

    /**
     * Whether or not this project was edited.
     * Undefined if we don't know, as not all editors keep track of their doings.
     */
    readonly edited?: boolean;
}

export function toEditor<P = any>(ed: (SimpleProjectEditor<P> | ProjectEditor<P>)): ProjectEditor<P> {
    return (proj, ctx, params) =>
        (ed as any)(proj, ctx, params)
            .then(r =>
                // See what it returns
                isProject(r) ?
                    successfulEdit(r, undefined) :
                    r as EditResult)
            .catch(err => failedEdit(proj, err));
}

export function successfulEdit<P extends Project>(p: P, edited: boolean): EditResult<P> {
    return {
        target: p,
        success: true,
        edited,
    };
}

export function failedEdit<P extends Project>(p: P, error: Error, edited: boolean = false): EditResult<P> {
    return {
        target: p,
        success: false,
        error,
        edited,
    };
}
