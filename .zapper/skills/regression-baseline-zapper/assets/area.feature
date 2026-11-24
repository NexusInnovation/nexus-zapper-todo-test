# language: <language code, omit this line for English>
Feature: <Area name> (existing behaviour)

  Background:
    Given <context shared by every scenario, omit the section when there is none>

  @regression @<area-id>
  Scenario: <Name stating the existing behaviour>
    Given <precondition>
    When <action>
    Then <observable outcome>
