/**
 * SPDX-FileCopyrightText: 2026 Brian Cornell
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Apple's Contacts app does not write the RFC 6350 standard `RELATED` or
 * `ANNIVERSARY` properties when syncing via CardDAV. Instead it writes its
 * own proprietary, item-grouped extension:
 *
 *   item1.X-ABRELATEDNAMES:Cheryl Yager-Brown
 *   item1.X-ABLabel:_$!<Spouse>!$_
 *
 *   item2.X-ABDATE:19970404
 *   item2.X-ABLabel:_$!<Anniversary>!$_
 *
 * Nextcloud Contacts has no knowledge of X-AB* properties at all, so this
 * data is silently invisible in the UI even though it is preserved
 * byte-for-byte in the stored vCard.
 *
 * This module is READ-ONLY by design: it derives a display-friendly list
 * from the vCard's existing properties without ever modifying `vCard`
 * itself. Nothing here is written back on save. Apple's own apps do not
 * reliably understand the standard RELATED/ANNIVERSARY properties, so
 * silently rewriting this data to the RFC form would break round-tripping
 * back to an iCloud account.
 */

const APPLE_LABEL_PATTERN = /^_\$!<(.+)>!\$_$/

function decodeAppleLabel(rawLabel) {
	if (!rawLabel) {
		return ''
	}
	const match = rawLabel.match(APPLE_LABEL_PATTERN)
	return match ? match[1] : rawLabel
}

function groupItemProperties(vCard) {
	const groups = new Map()

	vCard.getAllProperties().forEach((prop) => {
		const groupKey = prop.getParameter('group')
		if (!groupKey) {
			return
		}
		if (!groups.has(groupKey)) {
			groups.set(groupKey, [])
		}
		groups.get(groupKey).push(prop)
	})

	return groups
}

function findByBaseName(properties, baseName) {
	return properties.find((prop) => prop.name === baseName)
}

function findMeaningfulLabel(properties) {
	const labels = properties
		.filter((prop) => prop.name === 'x-ablabel')
		.map((prop) => prop.getFirstValue())
		.filter(Boolean)

	if (labels.length === 0) {
		return ''
	}

	const nonPref = labels.find((label) => label.toLowerCase() !== 'pref')
	return nonPref !== undefined ? nonPref : labels[0]
}

export function getAppleRelatedNames(vCard) {
	const results = []
	const groups = groupItemProperties(vCard)

	groups.forEach((properties) => {
		const nameProp = findByBaseName(properties, 'x-abrelatednames')
		if (!nameProp) {
			return
		}
		const rawLabel = findMeaningfulLabel(properties)

		results.push({
			type: decodeAppleLabel(rawLabel),
			value: nameProp.getFirstValue(),
		})
	})

	return results
}

export function getAppleDates(vCard) {
	const results = []
	const groups = groupItemProperties(vCard)

	groups.forEach((properties) => {
		const dateProp = findByBaseName(properties, 'x-abdate')
		if (!dateProp) {
			return
		}
		const rawLabel = findMeaningfulLabel(properties)

		results.push({
			type: decodeAppleLabel(rawLabel) || 'Date',
			value: dateProp.getFirstValue(),
		})
	})

	return results
}
