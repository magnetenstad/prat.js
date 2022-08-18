from symbol import *

def prefix_count(string, prefix):
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

def extract_attr(string, symbol):
	return extract(string, symbol + Symbol.left, Symbol.right)

def extract_key(string):
	return extract_attr(string, Symbol.key)[0]

def is_empty(string):
	return string == '' or string.isspace()
