import { PathExpression } from "@atomist/tree-path/path/pathExpression";
import { TreeNode } from "@atomist/tree-path/TreeNode";
import { File } from "../../project/File";

/**
 * Implemented by objects that can parse a file into an AST using a single grammar
 */
export interface FileParser {

    /**
     * Name of the top level production: name of the root TreeNode
     */
    rootName: string;

    /**
     * Parse a file, returning an AST
     * @param {File} f
     * @return {TreeNode} root tree node
     */
    toAst(f: File): Promise<TreeNode>;

    /**
     * Can this path expression possibly be valid using this parser?
     * If not, throw an Error
     * @param {PathExpression} pex
     */
    validate?(pex: PathExpression): void;
}

export function isFileParser(a: any): a is FileParser {
    return !!a && !!a.toAst;
}
