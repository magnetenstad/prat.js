
class Symbol:
	key = '#'
	author = '@'
	goto = '>'
	condition = '?'
	action = '!'
	comment = '%'
	left = '{'
	right = '}'

def prefixcount(string, prefix):
	i = 0
	while string[i] == prefix:
		i += 1
	return i

def extract(string, startsymbol, endsymbol):
	if not startsymbol in string and endsymbol in string:
		return ('', string)
	
	start = string.find(startsymbol) + len(startsymbol)
	end = -1
	depth = 0
	for i in range(start, len(string)):
		s = string[i:]
		if not depth and s.startswith(endsymbol):
			end = i
			break
		depth += s.startswith(Symbol.left)
		depth -= s.startswith(Symbol.right)
	
	if end == -1:
		return ('', string)
	
	extraction = string[start:end]
	return (extraction, string.replace(startsymbol + extraction + endsymbol, ''))

def extractattribute(string, symbol):
	return extract(string, symbol + Symbol.left, Symbol.right)

def extractkey(string):
	return extractattribute(string, Symbol.key)[0]

def isempty(string):
	return string == '' or string.isspace()

class Line:
	def __init__(self, key, text='', author='', goto='', choices=[], condition='', action='', comment=''):
		self.key = key
		self.text = text
		self.author = author
		self.goto = goto
		self.choices = choices
		self.condition = condition
		self.action = action
		self.comment = comment

	def __repr__(self) -> str:
		return self.author + ': ' + self.text

class Talk:
	def __init__(self):
		self.lines = {}
		self.key = None
	
	@staticmethod
	def fromString(talk_string):

		talk = Talk()

		talk_string = talk_string.replace('\\\n\t', '\\\n')
		talk_string = talk_string.replace('\\\n', '')
		
		lines = [line for line in talk_string.splitlines() if not isempty(line)]

		for i, line in enumerate(lines):
			if isempty(extractkey(line)):
				lines[i] = line + Symbol.key + Symbol.left + Symbol.key + str(i) + Symbol.right

		previousauthor = ''

		for i, line in enumerate(lines):
			choices = []
			goto, text = extractattribute(line, Symbol.goto)
			
			if isempty(goto):
				tabs_i = prefixcount(line, '\t')
				if tabs_i % 2 == 0:
					tabs_min = tabs_i
					for j in range(i + 1, len(lines)):
						tabs_j = prefixcount(lines[j], '\t')
						tabs_min = min(tabs_j, tabs_min)

						if tabs_j <= tabs_min:
							if choices:
								break
							if tabs_j % 2 == 0:
								goto = extractkey(lines[j])
								break
						
						if tabs_j == tabs_i + 1 and tabs_i == tabs_min:
							choices.append(extractkey(lines[j]))
				
				elif i + 1 < len(lines):
					goto = extractkey(lines[i + 1])

			key, text = extractattribute(text, Symbol.key)
			author, text = extractattribute(text, Symbol.author)
			condition, text = extractattribute(text, Symbol.condition)
			action, text = extractattribute(text, Symbol.action)
			comment, text = extractattribute(text, Symbol.comment)

			talk.addLine(Line(
				key,
				text = text.strip(),
				author = author if not isempty(author) else previousauthor,
				goto = goto,
				choices = choices,
				condition = condition,
				action = action,
				comment = comment
			))

			if i == 0:
				talk.key = key

			previousauthor = author
		
		return talk

	def addLine(self, line: Line):
		self.lines[line.key] = line
	
	def talk(self):
		string = ''
		line = self.lines[self.key]

		while isempty(line.text):
			self.key = line.goto
			line = self.lines[self.key]

		string += str(line) + '\n'

		choices = [l for l in self.lines.values() if l.key in line.choices]
		if choices:
			for i, choice in enumerate(choices):
				string += str(i) + ' ' + str(choice) + '\n'
		
		return string

	def input(self, string):
		line = self.lines[self.key]
		choices = [l.key for l in self.lines.values() if l.key in line.choices]
		
		if choices:
			try:
				self.key = choices[int(string)]
			except:
				self.key = choices[0]
		else:
			self.key = line.goto
		