{
	'targets': [
		{
			'target_name': 'artichoke',
			'include_dirs': [
				"<!(node -e \"require('nan')\")"
			],
			'sources': [ 'native/addon.cc', 'native/artichoke.cc' ]
		}
	]
}
