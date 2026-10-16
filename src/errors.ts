export class CliError extends Error {
    readonly exitCode: number;

    constructor(message: string, exitCode = 1) {
        super(message);
        this.name = new.target.name;
        this.exitCode = exitCode;
    }
}

export class UsageError extends CliError {
    constructor(message: string) {
        super(message, 2);
    }
}

export class ConfigError extends CliError {
    constructor(message: string) {
        super(message, 2);
    }
}

export class UploadConflictError extends CliError {
    readonly key: string;

    constructor(key: string, message = `An object already exists at ${key}.`) {
        super(message, 3);
        this.key = key;
    }
}

export class NotFoundError extends CliError {
    constructor(message: string) {
        super(message, 4);
    }
}

export class AmbiguousMatchError extends CliError {
    readonly matches: string[];

    constructor(identifier: string, matches: string[]) {
        super(`Identifier \"${identifier}\" matches multiple images: ${matches.join(', ')}`, 5);
        this.matches = matches;
    }
}

export class UnsupportedImageError extends CliError {
    constructor(message: string) {
        super(message, 6);
    }
}

export function formatError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return 'An unknown error occurred.';
}

export function getExitCode(error: unknown): number {
    return error instanceof CliError ? error.exitCode : 1;
}
