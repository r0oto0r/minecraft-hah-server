import { UserSelection, StateDiff, ChannelMode } from "../Interfaces/Interfaces";
import { MobType } from "../Interfaces/MobTypes";
import { Lane } from "../Interfaces/LaneTypes";
import { Log } from "../Log";

export class UserStateManager {
	private static userState: Map<string, UserSelection> = new Map();
	private static previousState: Map<string, UserSelection> = new Map();
	private static throttleTimer: NodeJS.Timeout | null = null;
	private static pendingUpdate: boolean = false;
	private static updateCallback: ((diff: StateDiff) => void) | null = null;
	private static readonly THROTTLE_INTERVAL_MS = 1000; // 1 second
	private static mode: ChannelMode = ChannelMode.SINGLE; // Default to single channel mode

	/**
	 * Set the callback function that will be called with state diffs
	 * @param callback Function to call with state diffs
	 */
	public static setUpdateCallback(callback: (diff: StateDiff) => void) {
		this.updateCallback = callback;
	}

	/**
	 * Set the channel mode (SINGLE or DUAL)
	 * @param mode Channel mode
	 */
	public static setMode(mode: ChannelMode) {
		this.mode = mode;
		Log.info(`Channel mode set to: ${mode}`);
	}

	/**
	 * Get the current channel mode
	 * @returns Current channel mode
	 */
	public static getMode(): ChannelMode {
		return this.mode;
	}

	/**
	 * Update or add a user's team selection
	 * @param userId User ID
	 * @param team Selected team
	 */
	public static updateUserTeam(userId: string, team: string) {
		const existing = this.userState.get(userId);
		if (existing) {
			existing.team = team;
		} else {
			this.userState.set(userId, {
				userId,
				mobType: MobType.ZOMBIE, // Default mob type
				lane: Lane.CENTER, // Default lane
				team
			});
		}
		this.scheduleUpdate();
		Log.info(`User ${userId} selected team: ${team}`);
	}

	/**
	 * Update or add a user's mob type selection
	 * @param userId User ID
	 * @param mobType Selected mob type
	 */
	public static updateUserMobType(userId: string, mobType: MobType) {
		const existing = this.userState.get(userId);
		if (existing) {
			existing.mobType = mobType;
		} else {
			this.userState.set(userId, {
				userId,
				mobType,
				lane: Lane.CENTER // Default lane
			});
		}
		this.scheduleUpdate();
		Log.info(`User ${userId} selected mob type: ${mobType}`);
	}

	/**
	 * Update or add a user's lane selection
	 * @param userId User ID
	 * @param lane Selected lane
	 */
	public static updateUserLane(userId: string, lane: Lane) {
		const existing = this.userState.get(userId);
		if (existing) {
			existing.lane = lane;
		} else {
			this.userState.set(userId, {
				userId,
				mobType: MobType.ZOMBIE, // Default mob type
				lane
			});
		}
		this.scheduleUpdate();
		Log.info(`User ${userId} selected lane: ${lane}`);
	}

	/**
	 * Set the channel name for a user (dual channel mode)
	 * @param userId User ID
	 * @param channelName Channel name
	 */
	public static setUserChannelName(userId: string, channelName: string) {
		const existing = this.userState.get(userId);
		if (existing) {
			existing.channelName = channelName;
		} else {
			this.userState.set(userId, {
				userId,
				mobType: MobType.ZOMBIE, // Default mob type
				lane: Lane.CENTER, // Default lane
				channelName
			});
		}
		Log.info(`User ${userId} channel name set to: ${channelName}`);
	}

	/**
	 * Check if a user can select mob (in single channel mode, team must be set first)
	 * @param userId User ID
	 * @returns true if user can select mob, false otherwise
	 */
	public static canSelectMob(userId: string): boolean {
		if (this.mode === ChannelMode.DUAL) {
			return true; // In dual mode, always allowed
		}
		
		// In single mode, team must be set first
		const existing = this.userState.get(userId);
		return existing !== undefined && existing.team !== undefined;
	}

	/**
	 * Remove a user from the state
	 * @param userId User ID to remove
	 */
	public static removeUser(userId: string) {
		if (this.userState.delete(userId)) {
			this.scheduleUpdate();
			Log.info(`User ${userId} removed from state`);
		}
	}

	/**
	 * Get the full current state
	 * @returns All user selections
	 */
	public static getFullState(): UserSelection[] {
		return Array.from(this.userState.values());
	}

	/**
	 * Calculate the state diff between current and previous state
	 * @returns State diff with added, updated, and removed users
	 */
	private static calculateStateDiff(): StateDiff {
		const added: UserSelection[] = [];
		const updated: UserSelection[] = [];
		const removed: string[] = [];

		// Find added and updated users
		for (const [userId, selection] of this.userState.entries()) {
			const previous = this.previousState.get(userId);
			if (!previous) {
				added.push(selection);
			} else if (
				previous.mobType !== selection.mobType ||
				previous.lane !== selection.lane ||
				previous.team !== selection.team ||
				previous.channelName !== selection.channelName
			) {
				updated.push(selection);
			}
		}

		// Find removed users
		for (const userId of this.previousState.keys()) {
			if (!this.userState.has(userId)) {
				removed.push(userId);
			}
		}

		return { added, updated, removed };
	}

	/**
	 * Schedule a throttled update
	 */
	private static scheduleUpdate() {
		this.pendingUpdate = true;

		// If timer is not running, start it
		if (!this.throttleTimer) {
			this.throttleTimer = setTimeout(() => {
				this.sendUpdate();
				this.throttleTimer = null;

				// If there's another pending update, schedule it
				if (this.pendingUpdate) {
					this.pendingUpdate = false;
					this.scheduleUpdate();
				}
			}, this.THROTTLE_INTERVAL_MS);
		}
	}

	/**
	 * Send the state update to the callback
	 */
	private static sendUpdate() {
		if (!this.updateCallback) {
			return;
		}

		const diff = this.calculateStateDiff();

		// Only send if there are actual changes
		if (diff.added.length > 0 || diff.updated.length > 0 || diff.removed.length > 0) {
			Log.info(`Sending state diff: ${diff.added.length} added, ${diff.updated.length} updated, ${diff.removed.length} removed`);
			this.updateCallback(diff);

			// Update previous state to current state
			this.previousState = new Map(this.userState);
		}

		this.pendingUpdate = false;
	}

	/**
	 * Clear all state (useful for testing or reset)
	 */
	public static clearState() {
		this.userState.clear();
		this.previousState.clear();
		if (this.throttleTimer) {
			clearTimeout(this.throttleTimer);
			this.throttleTimer = null;
		}
		this.pendingUpdate = false;
		Log.info("User state cleared");
	}
}
