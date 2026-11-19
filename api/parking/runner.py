from django.test.runner import DiscoverRunner


class ManagedModelsRunner(DiscoverRunner):
    """Let tests create the unmanaged tables in a throwaway database."""

    def setup_test_environment(self, **kw):
        from django.apps import apps
        self.unmanaged = [m for m in apps.get_models() if not m._meta.managed]
        for m in self.unmanaged:
            m._meta.managed = True
        super().setup_test_environment(**kw)

    def teardown_test_environment(self, **kw):
        super().teardown_test_environment(**kw)
        for m in self.unmanaged:
            m._meta.managed = False
