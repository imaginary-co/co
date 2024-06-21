// import { isNodeModule } from '../utils'
import { DirectiveResolver, Source, ResoveOptions } from './types'

import { Resolver } from './Resolver'

export class JsResolver extends Resolver implements DirectiveResolver {
  constructor() {
    super()
    this.supportedSourceExtensions = ['ts', 'tsx', 'js', 'jsx', 'cjs', 'mjs', 'vue']
  }

  resolve(content: string, options: ResoveOptions): Source {
    const matchCoContents = [...content.matchAll(/\/\/ co(?<coContent>[\s\S]*?)\/\/ co-end/g)]
    if (matchCoContents.length === 0) {
      return {
        path: options.filename,
        content,
        directives: [],
      }
    }
    const coContents = matchCoContents.map(match => match.groups?.coContent).filter(Boolean).join('\n')
    const matchImportSideEfferct = coContents.matchAll(/import\s+['"](?<path>[^\s]*?)['"]/g)

    const coContentRemoveSideEffect = coContents.replace(/import\s+['"][^\s]*?['"]/g, '')

    const matchImports = [
      ...coContentRemoveSideEffect.matchAll(/import[\s\S]*?from ['"](?<path>[^\s]*?)['"]/g),
      ...coContentRemoveSideEffect.matchAll(/require\(['"](?<path>[^\s]*?)['"]\)/g),
    ]

    const imports = matchImports.flatMap(
      match => match && match.groups ? [match.groups.path] : [],
    )
    const importsSideEffect = Array.from(matchImportSideEfferct).flatMap(
      match => match && match.groups ? [match.groups.path] : [],
    )

    const allImports = Array.from(
      new Set([
        ...imports,
        ...importsSideEffect,
      ]),
    ).flatMap((path) => {
      try {
        return [this.ensureAbsolutePath(options.filename, path)]
      }
      catch (e) {
        return []
      }
    })
    return {
      path: options.filename,
      content,
      directives: allImports.map((targetPath) => {
        return {
          targetPath,
        }
      }),
    }
  }
}
