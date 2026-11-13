// Compatibility for installations that used the previous entry point.
// The single course worker owns static caches; learner IndexedDB is untouched.
importScripts('/course-worker.js');
