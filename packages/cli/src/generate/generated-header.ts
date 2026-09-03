// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The banner on the generated module. It says three things, because a generated file that does
 * not say it is generated is a file someone edits once and loses.
 */
export const GENERATED_HEADER = `// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// GENERATED. Do not edit, and do not commit.
//
// A directory under src/assemblies is an assembly, and this file is how the built server
// imports them: a static import graph, so production never scans a directory at run time.
// It is rewritten from the filesystem on every dev start and every build.
`;
