using Nexus.ZapperTodo.Application.Todos;
using Nexus.ZapperTodo.Domain;
using Nexus.ZapperTodo.Domain.Exceptions;

namespace Nexus.ZapperTodo.UnitTests.Application.Todos;

public class TodoRulesTests
{
    [Fact]
    public void NormalizeTitle_GivenSurroundingSpaces_ThenReturnsTrimmedTitle()
    {
        TodoRules.NormalizeTitle("  Acheter du pain  ").Should().Be("Acheter du pain");
    }

    [Fact]
    public void NormalizeTitle_GivenHtml_ThenKeepsContentUnchanged()
    {
        TodoRules.NormalizeTitle("<b>gras</b>").Should().Be("<b>gras</b>");
    }

    [Fact]
    public void NormalizeTitle_Given200CharactersAfterTrim_ThenAccepts()
    {
        var title = new string('a', 200);

        TodoRules.NormalizeTitle($"  {title}  ").Should().Be(title);
    }

    [Fact]
    public void NormalizeTitle_Given201Characters_ThenThrowsTitleTooLong()
    {
        var act = () => TodoRules.NormalizeTitle(new string('a', 201));

        act.Should().Throw<ValidationException>()
            .Which.Errors["title"].Should().Equal(DomainErrors.Todo.TitleTooLong);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void NormalizeTitle_GivenEmptyAfterTrim_ThenThrowsTitleRequired(string? title)
    {
        var act = () => TodoRules.NormalizeTitle(title);

        act.Should().Throw<ValidationException>()
            .Which.Errors["title"].Should().Equal(DomainErrors.Todo.TitleRequired);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(1, 50)]
    [InlineData(7, 100)]
    public void ValidatePage_GivenBoundsWithinRange_ThenAccepts(int page, int pageSize)
    {
        var act = () => TodoRules.ValidatePage(page, pageSize);

        act.Should().NotThrow();
    }

    [Theory]
    [InlineData(0, 50, "page")]
    [InlineData(-1, 50, "page")]
    [InlineData(1, 0, "pageSize")]
    [InlineData(1, 101, "pageSize")]
    public void ValidatePage_GivenOutOfRange_ThenThrowsForThatParameter(int page, int pageSize, string parameter)
    {
        var act = () => TodoRules.ValidatePage(page, pageSize);

        act.Should().Throw<ValidationException>()
            .Which.Errors.Keys.Should().Equal(parameter);
    }
}
