export function copy<T>(object: T): T {
	if (Array.isArray(object)) {
		let newArray: unknown = [];
		for (let element of object) {
			// @ts-ignore
			newArray.push(copy(element));
		}
		return newArray as T;
	} else if (typeof object === 'object') {
		let newObject: unknown = {};
		for (let [key, value] of Object.entries(object)) {
			newObject[key] = copy(value);
		}
		return newObject as T;
	} else {
		return object;
	}
}

// Specify updates for an object
export type SetUpdater<T> = {
	[P in keyof T]?: T[P] extends {} ? SetUpdater<T[P]> : T[P];
};

export type UnsetUpdater<T> = {
	[P in keyof T]?: T[P] extends {} ? UnsetUpdater<T[P]> : true;
};

export type IncrementUpdater<T> = {
	[P in keyof T]?: T[P] extends number ? number : T[P] extends {} ? IncrementUpdater<T[P]> : never;
};

export type MinUpdater<T> = {
	[P in keyof T]?: T[P] extends number ? number : T[P] extends {} ? MinUpdater<T[P]> : never;
};

export type MaxUpdater<T> = {
	[P in keyof T]?: T[P] extends number ? number : T[P] extends {} ? MaxUpdater<T[P]> : never;
};

export type MultiplyUpdater<T> = {
	[P in keyof T]?: T[P] extends number ? number : T[P] extends {} ? MultiplyUpdater<T[P]> : never;
};

export type CurrentDateUpdater<T> = {
	[P in keyof T]?: T[P] extends {} ? CurrentDateUpdater<T[P]> : true;
};

export type PushUpdater<T> = {
	// If this key is an array, you can send an array of updates to push
	// If this key is not an array, but an object, you can send a nested PushUpdater
	[P in keyof T]?: T[P] extends [] ? T[P] : T[P] extends {} ? PushUpdater<T[P]> : never;
};

export type AddToSetUpdater<T> = {
	[P in keyof T]?: T[P] extends [] ? T[P] : T[P] extends {} ? AddToSetUpdater<T[P]> : never;
};

export type PopUpdater<T> = {
	[P in keyof T]?: T[P] extends [] ? 1 | -1 : T[P] extends {} ? PopUpdater<T[P]> : never;
};

export type Updater<T> = {
	// Object updates
	$set?: SetUpdater<T>;
	$unset?: UnsetUpdater<T>;
	$inc?: IncrementUpdater<T>;
	$min?: MinUpdater<T>;
	$max?: MaxUpdater<T>;
	$mul?: MultiplyUpdater<T>;
	$currentDate?: CurrentDateUpdater<T>;

	$push?: PushUpdater<T>;
	$addToSet?: AddToSetUpdater<T>;
	$pop?: PopUpdater<T>;
};

export function makeSetUpdates<T>(object: T, updater: SetUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (typeof updates === 'object') {
			newObject[key] = makeSetUpdates(object[key], updates);
		} else {
			newObject[key] = updates;
		}
	}
	return newObject;
}

export function makeUnsetUpdates<T>(object: T, updater: UnsetUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (typeof updates === 'object') {
			newObject[key] = makeUnsetUpdates(object[key], updates);
		} else {
			delete newObject[key];
		}
	}
	return newObject;
}

export function makeIncrementUpdates<T>(object: T, updater: IncrementUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (typeof updates === 'number') {
			newObject[key] = object[key] + updater[key];
		} else if (typeof updates === 'object') {
			newObject[key] = makeIncrementUpdates(object[key], updates);
		}
	}
	return newObject;
}

export const comparableTypes = ['number', 'boolean', 'bigint'];

export function makeMaxUpdates<T>(object: T, updater: MaxUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (comparableTypes.includes(typeof updates)) {
			newObject[key] = object[key] > updater[key] ? object[key] : updater[key];
		} else if (typeof updates === 'object') {
			newObject[key] = makeMaxUpdates(object[key], updates);
		}
	}
	return newObject;
}

export function makeMinUpdates<T>(object: T, updater: MinUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (comparableTypes.includes(typeof updates)) {
			newObject[key] = object[key] < updater[key] ? object[key] : updater[key];
		} else if (typeof updates === 'object') {
			newObject[key] = makeMinUpdates(object[key], updates);
		}
	}
	return newObject;
}

export function makeMultiplyUpdates<T>(object: T, updater: MultiplyUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (typeof updates === 'number') {
			newObject[key] = object[key] * updates;
		} else if (typeof updates === 'object') {
			newObject[key] = makeMultiplyUpdates(object[key], updates);
		}
	}
	return newObject;
}

export function makeCurrentDateUpdates<T>(object: T, updater: CurrentDateUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (typeof updates === 'object') {
			newObject[key] = makeCurrentDateUpdates(object[key], updates);
		} else {
			newObject[key] = new Date().getTime();
		}
	}
	return newObject;
}

export function makePushUpdates<T>(object: T, updater: PushUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (Array.isArray(object[key])) {
			newObject[key].push(...(updates as any[]));
		} else if (typeof object[key] === 'object') {
			newObject[key] = makePushUpdates(object[key], updates);
		}
	}
	return newObject;
}

export function makeAddToSetUpdates<T>(object: T, updater: AddToSetUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (Array.isArray(object[key])) {
			let seen = new Set(object[key]);
			for (let element of object[key]) {
				if (!seen.has(element)) {
					newObject[key].push(element);
					seen.add(element);
				}
			}
		} else if (typeof object[key] === 'object') {
			newObject[key] = makeAddToSetUpdates(object[key], updates);
		}
	}
	return newObject;
}

export function makePopUpdates<T>(object: T, updater: PopUpdater<T>): T {
	let newObject = copy(object);
	for (let [key, updates] of Object.entries(updater)) {
		if (typeof updates === 'object') {
			newObject[key] = makePopUpdates(object[key], updates);
		} else {
			if (updates === -1) {
				newObject[key].pop();
			} else {
				newObject[key].shift();
			}
		}
	}
	return newObject;
}

export function mutate<T>(object: T, updates: Updater<T>) {
	if (updates.$set) {
		object = makeSetUpdates(object, updates.$set);
	}
	if (updates.$unset) {
		object = makeUnsetUpdates(object, updates.$unset);
	}
	if (updates.$push) {
		object = makePushUpdates(object, updates.$push);
	}
	if (updates.$inc) {
		object = makeIncrementUpdates(object, updates.$inc);
	}
	if (updates.$max) {
		object = makeMaxUpdates(object, updates.$max);
	}
	if (updates.$min) {
		object = makeMinUpdates(object, updates.$min);
	}
	if (updates.$addToSet) {
		object = makeAddToSetUpdates(object, updates.$addToSet);
	}
	if (updates.$pop) {
		object = makePopUpdates(object, updates.$pop);
	}

	return object;
}

export type Booleanify<T> = {
	[P in keyof T]?: boolean | (T[P] extends {} ? Booleanify<T[P]> : boolean);
};

export type Permissions<T> = Booleanify<T>;

/**
 * Given a set of permissions, modeled directly after an update schema,
 * determine whether or not a set of updates are permissible.
 * @param permissions Whether or not certain actions are allowed.
 * @param updates The proposed updates.
 */
export function verify<T>(
	permissions: Booleanify<T>,
	updates: T,
	defaultPermission: boolean = false
): {
	allowed: boolean;
	errors: string[];
} {
	let result = true;
	let errors: string[] = [];
	for (let key in updates) {
		let permission = permissions[key];
		if (typeof permission === 'object') {
			// @ts-ignore
			let verification = verify(permission, updates[key]);
			if (verification.allowed === false) {
				errors.push(...verification.errors.map((error) => key + '.' + error));
				result = false;
			}
		} else {
			if (permission === false) {
				errors.push(key);
				result = false;
			} else if (permission !== true) {
				if (defaultPermission === false) {
					errors.push(key);
					result = false;
				}
			}
		}
	}
	return { allowed: result, errors };
}
