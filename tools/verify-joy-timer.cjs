const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");
const {test} = require("node:test");
const vm = require("node:vm");
const source = readFileSync(path.join(__dirname, "../joy-timer.js"), "utf8");
const context = vm.createContext({Date, setInterval, clearInterval});
vm.runInContext(source, context);

function harness() {
    let time = 0, state, finishes = 0, ticks = 0, nextId = 0;
    const scheduled = new Map();
    const timer = context.createJoyCountdown({
        now: () => time,
        schedule: callback => { const id = ++nextId; scheduled.set(id, callback); return id; },
        unschedule: id => scheduled.delete(id),
        onTick: next => { state = next; ticks++; },
        onFinish: () => finishes++
    });
    return {
        timer,
        advance(ms, poll = true) { time += ms; if (poll) for (const callback of [...scheduled.values()]) callback(); },
        get state() { return state; },
        get finishes() { return finishes; },
        get ticks() { return ticks; },
        get active() { return scheduled.size; }
    };
}

test("each supported minute duration finishes once at its deadline", () => {
    for (let minutes = 5; minutes <= 10; minutes++) {
        const h = harness();
        assert.equal(h.timer.setMinutes(minutes), true);
        assert.equal(h.state.remainingSeconds, minutes * 60);
        h.timer.start(); h.timer.start();
        assert.equal(h.active, 1);
        h.advance(minutes * 60000 - 1);
        assert.equal(h.state.remainingSeconds, 1);
        assert.equal(h.finishes, 0);
        h.advance(1);
        assert.equal(h.state.status, "finished");
        assert.equal(h.state.remainingSeconds, 0);
        assert.equal(h.finishes, 1);
        assert.equal(h.active, 0);
        h.advance(60000); h.timer.sync(); h.timer.pause();
        assert.equal(h.finishes, 1);
    }
});

test("pause preserves exact remaining time and resume uses a new deadline", () => {
    const h = harness();
    h.timer.start(); h.advance(1250); h.timer.pause();
    assert.equal(h.state.status, "paused");
    assert.equal(h.state.remainingSeconds, 299);
    assert.equal(h.active, 0);
    assert.equal(h.timer.setMinutes(10), false);
    h.advance(120000);
    assert.equal(h.state.remainingSeconds, 299);
    h.timer.start(); h.advance(298749);
    assert.equal(h.finishes, 0);
    h.advance(1);
    assert.equal(h.finishes, 1);
});

test("a throttled background tab catches up without extending the timer", () => {
    const h = harness();
    h.timer.start(); h.advance(301000, false);
    assert.equal(h.finishes, 0);
    h.timer.sync();
    assert.equal(h.state.status, "finished");
    assert.equal(h.state.remainingSeconds, 0);
    assert.equal(h.finishes, 1);
    assert.equal(h.active, 0);
});

test("reset cancels pending completion, retains chosen duration, and permits restart", () => {
    const h = harness();
    h.timer.setMinutes(8); h.timer.start(); h.advance(60000);
    h.timer.reset();
    assert.equal(h.active, 0);
    assert.equal(h.state.remainingSeconds, 480);
    assert.equal(h.state.status, "idle");
    h.advance(600000);
    assert.equal(h.finishes, 0);
    h.timer.start(); h.advance(480000);
    assert.equal(h.finishes, 1);
    h.timer.start(); h.advance(480000);
    assert.equal(h.finishes, 2);
});

test("leaving the page disposes work and prevents late completion", () => {
    const h = harness();
    h.timer.start(); h.advance(1000); h.timer.dispose();
    const count = h.ticks;
    assert.equal(h.active, 0);
    h.advance(600000); h.timer.sync(); h.timer.start(); h.timer.reset();
    assert.equal(h.finishes, 0);
    assert.equal(h.ticks, count);
    assert.equal(h.timer.setMinutes(6), false);
});

test("rejects invalid durations and changes during a running countdown", () => {
    const h = harness();
    for (const minutes of [0, 4, 11, 5.5, NaN, "6"]) assert.equal(h.timer.setMinutes(minutes), false);
    h.timer.start();
    assert.equal(h.timer.setMinutes(10), false);
    assert.equal(h.state.minutes, 5);
});
