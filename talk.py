
def prefixCount(string, prefix):
	i = 0
	while string[i] == prefix:
		i += 1
	return i

def extract(line, startSymbol, endSymbol):
	result = ''
	if startSymbol in line:
		start = line.find(startSymbol)
		end = start + line[start:].find(endSymbol) + len(endSymbol)
		result = line[start + len(startSymbol):end - len(endSymbol)]
	return result

class Line:
	def __init__(self, _id, text='', author='', _next='', choices=[], condition='', action='', comment=''):
		self.id = _id
		self.text = text
		self.author = author
		self.next = _next
		self.choices = choices
		self.condition = condition
		self.action = action
		self.comment = comment

class Talk:
	def __init__(self):
		self.lines = {}
		self.key = ''
	
	@staticmethod
	def fromString(talkString):

		talk = Talk()

		while '\\\n\t' in talkString:
			talkString = talkString.replace('\\\n\t', '\\\n')
		while '\\\n' in talkString:
			talkString = talkString.replace('\\\n', '')

		lines = talkString.splitlines()

		for i, line in enumerate(lines):
			if extract(line, '@{', '}') == '':
				lines[i] = line + '@{@' + str(i) +'}'

		for i, line in enumerate(lines):
			tabs_i = prefixCount(line, '\t')
			choices = []
			_id = extract(line, '@{', '}')
			_next = extract(line, '>{', '}')
			if tabs_i % 2 == 0:
				for j in range(i + 1, len(lines)):
					tabs_j = prefixCount(lines[j], '\t')
					if tabs_j <= tabs_i:
						if j == i + 1 and tabs_j == tabs_i and _next == '':
							_next = extract(lines[j], '@{', '}')
						break
					elif tabs_j == tabs_i + 1:
						choices.append(extract(lines[j], '@{', '}'))
			elif _next == '' and i + 1 < len(lines):
				_next = extract(lines[i + 1], '@{', '}')

			talk.addLine(Line(
				_id,
				text=extract(line, '&{', '}'),
				author='',
				_next=_next,
				choices=choices,
				condition=extract(line, '?{', '}'),
				action=extract(line, '*{', '}'),
				comment=extract(line, '#{', '}')
			))

			if i == 0:
				talk.setKey(_id)
		
		return talk

	def addLine(self, line: Line):
		self.lines[line.id] = line

	def talk(self):
		line = self.lines[self.key]
		choices = [l for l in self.lines.values() if l.id in line.choices]
		key = line.next
		print(line.text)
		if choices:
			for i, line in enumerate(choices):
				print(i, line.text)
			key = choices[int(input())].next
		else:
			input()
		if self.setKey(key):
			self.talk()
		
	def setKey(self, key):
		if not key in self.lines:
			return False
		self.key = key
		return True

with open('talks/talk.talk') as file:
	talkString = file.read()

talk = Talk.fromString(talkString)
talk.talk()
