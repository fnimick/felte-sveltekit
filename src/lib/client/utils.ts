export function submitterHasFormAction(
	event: SubmitEvent
): event is SubmitEvent & { submitter: SubmitEvent['submitter'] & { formAction: string } } {
	return event.submitter?.hasAttribute('formAction') ?? false;
}
