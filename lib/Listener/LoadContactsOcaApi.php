<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts_appleab\Listener;

use OCA\Contacts_appleab\AppInfo\Application;
use OCA\Contacts_appleab\Event\LoadContactsOcaApiEvent;
use OCP\AppFramework\Services\IInitialState;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * @template-implements IEventListener<Event|LoadContactsOcaApiEvent>
 */
class LoadContactsOcaApi implements IEventListener {
	public function __construct(
		private IInitialState $initialState,
	) {
	}

	#[\Override]
	public function handle(Event $event): void {
		if (!($event instanceof LoadContactsOcaApiEvent)) {
			return;
		}

		// TODO: do we need to provide more initial state?
		$this->initialState->provideInitialState('supportedNetworks', []);
		Util::addScript(Application::APP_ID, 'contacts_appleab-oca');
		Util::addStyle(Application::APP_ID, 'contacts_appleab-oca');
	}
}
