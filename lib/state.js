const sub = require('../lib/linalgebra/sub.js');
const transpose = require('../lib/linalgebra/transpose.js');
const matMul = require('../lib/linalgebra/mat-mul.js');
const invert = require('../lib/linalgebra/invert.js');
const arrayToMatrix = require('../lib/utils/array-to-matrix.js');

const checkMatrix = function (matrix, shape) {
	if (matrix.reduce((a, b) => a.concat(b)).filter(a => Number.isNaN(a)).length > 0) {
		throw (new Error('Matrix should not have a NaN'));
	}

	if (shape) {
		checkShape(matrix, shape);
	}
};

const checkShape = function (matrix, shape) {
	if (matrix.length !== shape[0]) {
		throw (new Error('shape and length do not match'));
	}

	if (shape.length > 1) {
		return matrix.forEach(m => checkShape(m, shape.slice(1)));
	}
};

/**
 * @class
 * Class representing a multi dimensionnal gaussian, with his mean and his covariance
 * @property {Number} [index=0] the index of the State in the process, this is not mandatory for simple Kalman Filter, but is needed for most of the use case of extended kalman filter
 * @property {Array.<Array.<Number>>} covariance square matrix of size dimension
 * @property {Array.<Array<Number>>} mean column matrix of size dimension x 1
 */
class State {
	constructor({mean, covariance, index}) {
		this.mean = mean;
		this.covariance = covariance;
		this.index = index;
	}

	/**
	* Check the consistency of the State
	*/
	check() {
		this.constructor.check(this);
	}

	/**
	* Check the consistency of the State's attributes
	*/

	static check(state, {dimension = null} = {}) {
		if (!(state instanceof State)) {
			throw (new TypeError('The argument is not a state'));
		}

		const {mean, covariance} = state; // Index
		const meanDimension = mean.length;
		if (typeof (dimension) === 'number' && meanDimension !== dimension) {
			throw (new Error(`${meanDimension} and ${dimension} are not the same`));
		}

		checkMatrix(mean, [meanDimension, 1]);
		checkMatrix(covariance, [meanDimension, meanDimension]);

		// If (typeof (index) !== 'number') {
		// 	throw (new TypeError('t must be a number'));
		// }
	}

	mahalanobis({kf, observation}) {
		const correctlySizedObservation = arrayToMatrix({observation, dimension: observation.length});
		const stateProjection = kf.observation.stateProjection();
		const diff = sub(matMul(stateProjection, this.mean), correctlySizedObservation);
		const diffTransposed = transpose(diff);

		const covarianceInObservationSpace = matMul(
			matMul(stateProjection, this.covariance),
			transpose(stateProjection)
		);
		// Console.log('covariance in obs space', covarianceInObservationSpace);
		const covarianceInvert = invert(covarianceInObservationSpace);
		// Console.log('invert cov', covarianceInvert);
		return Math.sqrt(
			matMul(
				matMul(
					diffTransposed,
					covarianceInvert
				),
				diff
			)
		);
	}
}

module.exports = State;