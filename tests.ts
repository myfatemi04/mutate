import { Booleanify, mutate, Updater, verify } from './mutate';

interface Person {
	name: string;
	age: number;
	location: string;
	favoriteFoods: {
		name: string;
	}[];
}

let me: Person = {
	name: 'Michael',
	age: 16,
	location: 'My house',
	favoriteFoods: [{ name: 'galbi' }]
};

let allowedMutations: Booleanify<Updater<Person>> = {
	$push: {
		favoriteFoods: true
	}
};

let newMe = verify(allowedMutations, {
	$set: {
		name: 'Michael'
	},
	$inc: {
		age: 1
	},
	$push: {
		favoriteFoods: [{ name: 'banana' }]
	}
});

console.log(newMe);
