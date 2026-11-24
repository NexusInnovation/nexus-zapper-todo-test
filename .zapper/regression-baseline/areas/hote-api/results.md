# Results: Hôte de l'API et accès aux données (RG-04)

Run: 2026-11-24T23:03:20.942Z · Command: `pnpm --dir src/frontend regression`

| Source | Item | Status |
| --- | --- | --- |
| regression scenario | Le point de santé de l'API répond qu'elle est disponible | passed |
| existing test | src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs :: Nexus.ZapperTodo.UnitTests.Infrastructure.InfrastructureServiceRegistrationTests.RegisterInfrastructureServices_ShouldRegisterDapperConnectionFactory | passed |
| existing test | src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs :: Nexus.ZapperTodo.UnitTests.Infrastructure.InfrastructureServiceRegistrationTests.RegisterInfrastructureServices_ShouldRegisterGenericRepository | passed |
| existing test | src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs :: Nexus.ZapperTodo.UnitTests.Infrastructure.InfrastructureServiceRegistrationTests.RegisterInfrastructureServices_ShouldRegisterIUnitOfWorkAsScoped | passed |
| existing test | src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs :: Nexus.ZapperTodo.UnitTests.Infrastructure.InfrastructureServiceRegistrationTests.RegisterInfrastructureServices_ShouldNotRegisterIDbConnection | passed |
