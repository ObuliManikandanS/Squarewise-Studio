import { Workspace } from '../workspace';
import {requirePage} from '../../lib/page-session';
export default async function Page(){await requirePage('/account');return <Workspace path="/account"/>}
