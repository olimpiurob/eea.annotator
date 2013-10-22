""" Custom viewlets
"""
from zope.component.hooks import getSite
from zope.component import queryAdapter
from plone.app.layout.viewlets import common
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from eea.annotator.controlpanel.interfaces import ISettings

class Annotator(common.ViewletBase):
    """ Custom viewlet
    """
    render = ViewPageTemplateFile('../zpt/viewlet.pt')

    def __init__(self, context, request, view, manager=None):
        super(Annotator, self).__init__(context, request, view, manager)
        self._settings = None

    @property
    def settings(self):
        """ Settings
        """
        if self._settings is None:
            site = getSite()
            self._settings = queryAdapter(site, ISettings)
        return self._settings

    @property
    def available(self):
        """ Available
        """
        disabled = getattr(self.context, "disableAnnotator", None)
        if disabled:
            return False

        visibleFor = self.settings.portalTypes or []
        ctype = getattr(self.context, 'portal_type', None)
        if ctype in visibleFor:
            return True
        return False