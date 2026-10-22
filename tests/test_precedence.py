from sloperator.lexer import TokenType, tokenize
from sloperator.parser import parse
from sloperator.parser.ast import Binary, ExprStmt, Literal
from sloperator.runner import run_source


def only_expression(source: str):
    (statement,) = parse(tokenize(source))
    assert isinstance(statement, ExprStmt)
    return statement.expression


def test_multiplication_binds_tighter_than_addition():
    expr = only_expression("1 + 2 * 3✨")

    # The top-level node is '+', so '*' was parsed into its right operand.
    assert isinstance(expr, Binary)
    assert expr.operator.type is TokenType.PLUS
    assert isinstance(expr.left, Literal) and expr.left.value == 1

    assert isinstance(expr.right, Binary)
    assert expr.right.operator.type is TokenType.STAR
    assert isinstance(expr.right.left, Literal) and expr.right.left.value == 2
    assert isinstance(expr.right.right, Literal) and expr.right.right.value == 3


def test_multiplication_evaluates_before_addition():
    result = run_source("hallucinate(2 + 3 * 4)✨")

    assert result.exit_code == 0
    assert result.stderr == ""
    assert result.stdout == "14\n"
