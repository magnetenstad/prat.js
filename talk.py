from util import *

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
		return self.author + ': ' + self.text if self.author else self.text

class Talk:
	def __init__(self):
		self.lines = {}
		self.key = None
	
	@staticmethod
	def from_string(talk_string):
		talk = Talk()
		talk_string = talk_string.replace('\\\n\t', '\\\n')
		talk_string = talk_string.replace('\\\n', '')
		lines = [line for line in talk_string.splitlines() if not is_empty(line)]

		for i, line in enumerate(lines):
			if is_empty(extract_key(line)):
				key_attr = Symbol.key + Symbol.left + Symbol.key + str(i) + Symbol.right
				lines[i] = line + key_attr

		author_prev = ''

		for i, line in enumerate(lines):
			choices = []
			goto, text = extract_attr(line, Symbol.goto)
			
			if is_empty(goto):
				tabs_i = prefix_count(line, '\t')
				if tabs_i % 2 == 0:
					tabs_min = tabs_i
					for j in range(i + 1, len(lines)):
						tabs_j = prefix_count(lines[j], '\t')
						tabs_min = min(tabs_j, tabs_min)

						if tabs_j <= tabs_min:
							if choices:
								break
							if tabs_j % 2 == 0:
								goto = extract_key(lines[j])
								break
						
						if tabs_j == tabs_i + 1 and tabs_i == tabs_min:
							choices.append(extract_key(lines[j]))
				
				elif i + 1 < len(lines):
					goto = extract_key(lines[i + 1])

			key, text 			= extract_attr(text, Symbol.key)
			author, text 		= extract_attr(text, Symbol.author)
			condition, text = extract_attr(text, Symbol.condition)
			action, text 		= extract_attr(text, Symbol.action)
			comment, text 	= extract_attr(text, Symbol.comment)
			author = author if not is_empty(author) else author_prev
			text = text.strip()
			talk.add_line(
				Line(key, text, author, goto, choices, condition, action, comment)
			)

			if i == 0:
				talk.key = key

			author_prev = author
		
		return talk

	def add_line(self, line: Line):
		self.lines[line.key] = line
	
	def talk(self):
		string = ''
		line = self.lines[self.key]

		while is_empty(line.text):
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
		